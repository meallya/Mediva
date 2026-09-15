<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssetCategory;
use App\Models\InventoryItem;
use App\Models\InventoryWarehouse;
use App\Models\ProcurementQuotation;
use App\Models\ProcurementQuotationItem;
use App\Models\ProcurementReceipt;
use App\Models\ProcurementRequest;
use App\Models\ProcurementRequestItem;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\Unit;
use App\Services\AuditLogger;
use App\Services\ProcurementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProcurementController extends Controller
{
    public function __construct(private readonly ProcurementService $service) {}

    public function dashboard(): JsonResponse
    {
        return response()->json(['data'=>['summary'=>[
            'submitted_requests'=>ProcurementRequest::where('status','submitted')->count(),
            'approved_requests'=>ProcurementRequest::where('status','approved')->count(),
            'open_orders'=>PurchaseOrder::whereIn('status',['draft','issued','partially_received'])->count(),
            'completed_requests'=>ProcurementRequest::where('status','completed')->count(),
        ],'recent_requests'=>ProcurementRequest::with(['unit:id,code,name','requestedBy:id,name'])->latest('id')->limit(8)->get()]]);
    }

    public function options(): JsonResponse
    {
        return response()->json(['data'=>[
            'units'=>Unit::where('is_active',true)->orderBy('name')->get(['id','code','name']),
            'suppliers'=>Supplier::where('is_active',true)->orderBy('name')->get(['id','code','name']),
            'inventory_items'=>InventoryItem::where('is_active',true)->orderBy('name')->get(['id','code','name','uom_id']),
            'asset_categories'=>AssetCategory::where('is_active',true)->orderBy('name')->get(['id','code','name','asset_type']),
            'warehouses'=>InventoryWarehouse::where('is_active',true)->orderBy('name')->get(['id','code','name']),
            'approved_requests'=>ProcurementRequest::with('items')->where('status','approved')->latest('id')->get(),
            'receivable_orders'=>PurchaseOrder::with(['supplier:id,code,name','items'])->whereIn('status',['issued','partially_received'])->latest('id')->get(),
        ]]);
    }

    public function requests(Request $request): JsonResponse
    {
        $q=ProcurementRequest::with(['unit:id,code,name','requestedBy:id,name','approvedBy:id,name','items.inventoryItem:id,code,name','items.assetCategory:id,code,name'])->latest('id');
        if(($status=$request->query('status')) && $status!=='all') $q->where('status',$status);
        return response()->json($q->paginate(min(max((int)$request->query('per_page',10),5),100)));
    }

    public function storeRequest(Request $request): JsonResponse
    {
        $data=$request->validate(['unit_id'=>['required','integer','exists:units,id'],'notes'=>['nullable','string','max:3000'],'items'=>['required','array','min:1'],
            'items.*.item_kind'=>['required',Rule::in(['inventory','asset','medical_equipment'])],'items.*.inventory_item_id'=>['nullable','integer','exists:inventory_items,id'],'items.*.asset_category_id'=>['nullable','integer','exists:asset_categories,id'],
            'items.*.item_name'=>['required','string','max:200'],'items.*.specification'=>['nullable','string','max:2000'],'items.*.quantity'=>['required','numeric','gt:0'],'items.*.estimated_unit_price'=>['nullable','numeric','min:0']]);
        $row=DB::transaction(function() use($data,$request){
            $r=ProcurementRequest::create(['request_number'=>$this->number('REQ'),'unit_id'=>$data['unit_id'],'status'=>'submitted','notes'=>$data['notes']??null,'requested_by'=>$request->user()->id]);
            foreach($data['items'] as $item){
                if($item['item_kind']==='inventory' && empty($item['inventory_item_id'])) throw ValidationException::withMessages(['inventory_item_id'=>'Item inventory wajib terhubung ke Item Master.']);
                if(in_array($item['item_kind'],['asset','medical_equipment'],true) && empty($item['asset_category_id'])) throw ValidationException::withMessages(['asset_category_id'=>'Asset / Alkes wajib memiliki kategori asset.']);
                ProcurementRequestItem::create(['procurement_request_id'=>$r->id,'item_kind'=>$item['item_kind'],'inventory_item_id'=>$item['inventory_item_id']??null,'asset_category_id'=>$item['asset_category_id']??null,'item_name'=>$item['item_name'],'specification'=>$item['specification']??null,'quantity'=>$item['quantity'],'estimated_unit_price'=>$item['estimated_unit_price']??0]);
            }
            return $r->fresh(['unit','items.inventoryItem','items.assetCategory']);
        });
        AuditLogger::log($request,'procurement.request.create','procurement',"Buat procurement request {$row->request_number}",newValues:$row->toArray());
        return response()->json(['message'=>'Purchase Request berhasil dibuat.','data'=>$row],201);
    }

    public function approve(Request $request, ProcurementRequest $procurementRequest): JsonResponse
    {
        if($procurementRequest->status!=='submitted') throw ValidationException::withMessages(['status'=>'Hanya request submitted yang dapat disetujui.']);
        $procurementRequest->update(['status'=>'approved','approved_by'=>$request->user()->id,'approved_at'=>now(),'rejection_reason'=>null]);
        AuditLogger::log($request,'procurement.request.approve','procurement',"Approve {$procurementRequest->request_number}");
        return response()->json(['message'=>'Purchase Request disetujui.','data'=>$procurementRequest->fresh()]);
    }

    public function reject(Request $request, ProcurementRequest $procurementRequest): JsonResponse
    {
        $data=$request->validate(['reason'=>['required','string','max:2000']]);
        if($procurementRequest->status!=='submitted') throw ValidationException::withMessages(['status'=>'Hanya request submitted yang dapat ditolak.']);
        $procurementRequest->update(['status'=>'rejected','rejection_reason'=>$data['reason']]);
        AuditLogger::log($request,'procurement.request.reject','procurement',"Tolak {$procurementRequest->request_number}");
        return response()->json(['message'=>'Purchase Request ditolak.','data'=>$procurementRequest->fresh()]);
    }

    public function quotations(Request $request): JsonResponse
    {
        $q=ProcurementQuotation::with(['request:id,request_number,status','supplier:id,code,name','items.requestItem'])->latest('id');
        if($request->query('request_id')) $q->where('procurement_request_id',$request->query('request_id'));
        return response()->json($q->paginate(min(max((int)$request->query('per_page',10),5),100)));
    }

    public function storeQuotation(Request $request): JsonResponse
    {
        $data=$request->validate(['procurement_request_id'=>['required','integer','exists:procurement_requests,id'],'supplier_id'=>['required','integer','exists:suppliers,id'],'quotation_number'=>['nullable','string','max:100'],'quotation_date'=>['nullable','date'],'notes'=>['nullable','string','max:2000'],'items'=>['required','array','min:1'],'items.*.procurement_request_item_id'=>['required','integer','exists:procurement_request_items,id'],'items.*.quantity'=>['required','numeric','gt:0'],'items.*.unit_price'=>['required','numeric','min:0']]);
        $req=ProcurementRequest::with('items')->findOrFail($data['procurement_request_id']); if($req->status!=='approved') throw ValidationException::withMessages(['status'=>'Quotation hanya dapat dicatat untuk Purchase Request approved.']);
        $quotation=DB::transaction(function() use($data,$request,$req){
            $q=ProcurementQuotation::create(['procurement_request_id'=>$req->id,'supplier_id'=>$data['supplier_id'],'quotation_number'=>$data['quotation_number']??null,'quotation_date'=>$data['quotation_date']??now()->toDateString(),'notes'=>$data['notes']??null,'created_by'=>$request->user()->id]); $total=0;
            foreach($data['items'] as $item){ if(!$req->items->contains('id',(int)$item['procurement_request_item_id'])) throw ValidationException::withMessages(['items'=>'Item quotation tidak berasal dari Purchase Request yang dipilih.']); $line=(float)$item['quantity']*(float)$item['unit_price']; $total+=$line; ProcurementQuotationItem::create(['procurement_quotation_id'=>$q->id,'procurement_request_item_id'=>$item['procurement_request_item_id'],'quantity'=>$item['quantity'],'unit_price'=>$item['unit_price'],'line_total'=>$line]); }
            $q->update(['total_amount'=>$total]); return $q->fresh(['supplier','request','items.requestItem']);
        });
        AuditLogger::log($request,'procurement.quotation.create','procurement',"Tambah quotation untuk {$quotation->request?->request_number}",newValues:$quotation->toArray());
        return response()->json(['message'=>'Quotation vendor berhasil dicatat.','data'=>$quotation],201);
    }

    public function selectQuotation(Request $request, ProcurementQuotation $procurementQuotation): JsonResponse
    {
        $order=$this->service->selectQuotation($procurementQuotation,$request->user()->id);
        AuditLogger::log($request,'procurement.quotation.select','procurement',"Pilih quotation dan buat PO {$order->order_number}",newValues:$order->toArray());
        return response()->json(['message'=>'Quotation dipilih dan Purchase Order draft berhasil dibuat.','data'=>$order]);
    }

    public function orders(Request $request): JsonResponse
    {
        $q=PurchaseOrder::with(['supplier:id,code,name','request:id,request_number,status','items.inventoryItem:id,code,name','items.assetCategory:id,code,name'])->latest('id');
        if(($status=$request->query('status')) && $status!=='all') $q->where('status',$status);
        return response()->json($q->paginate(min(max((int)$request->query('per_page',10),5),100)));
    }

    public function issueOrder(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        if($purchaseOrder->status!=='draft') throw ValidationException::withMessages(['status'=>'Hanya PO draft yang dapat diterbitkan.']);
        $data=$request->validate(['expected_date'=>['nullable','date'],'notes'=>['nullable','string','max:2000']]);
        $purchaseOrder->update(['status'=>'issued','order_date'=>now()->toDateString(),'expected_date'=>$data['expected_date']??null,'notes'=>$data['notes']??$purchaseOrder->notes]);
        AuditLogger::log($request,'procurement.order.issue','procurement',"Terbitkan PO {$purchaseOrder->order_number}");
        return response()->json(['message'=>'Purchase Order berhasil diterbitkan.','data'=>$purchaseOrder->fresh(['supplier','items'])]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $data=$request->validate(['warehouse_id'=>['nullable','integer','exists:inventory_warehouses,id'],'received_date'=>['required','date'],'notes'=>['nullable','string','max:2000'],'items'=>['required','array','min:1'],'items.*.purchase_order_item_id'=>['required','integer','exists:purchase_order_items,id'],'items.*.quantity_received'=>['required','numeric','gt:0']]);
        $receipt=$this->service->receive($purchaseOrder,$data,$request->user()->id);
        AuditLogger::log($request,'procurement.receive','procurement',"Penerimaan PO {$purchaseOrder->order_number}",newValues:$receipt->toArray());
        return response()->json(['message'=>'Penerimaan barang berhasil diproses. Inventory/Asset otomatis diperbarui.','data'=>$receipt],201);
    }

    public function receipts(Request $request): JsonResponse
    {
        return response()->json(ProcurementReceipt::with(['order:id,order_number,supplier_id','order.supplier:id,code,name','warehouse:id,code,name','receivedBy:id,name','items.orderItem'])->latest('id')->paginate(min(max((int)$request->query('per_page',10),5),100)));
    }

    private function number(string $prefix): string { return sprintf('PRC-%s-%s-%s',$prefix,now()->format('YmdHis'),strtoupper(bin2hex(random_bytes(2)))); }
}
