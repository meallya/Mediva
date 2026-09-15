<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\ProcurementQuotation;
use App\Models\ProcurementReceipt;
use App\Models\ProcurementReceiptItem;
use App\Models\ProcurementRequest;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcurementService
{
    public function __construct(private readonly GeneralInventoryStockService $stockService) {}

    public function selectQuotation(ProcurementQuotation $quotation, int $userId): PurchaseOrder
    {
        return DB::transaction(function() use($quotation,$userId){
            $quotation=ProcurementQuotation::with(['items.requestItem','request'])->lockForUpdate()->findOrFail($quotation->id);
            if($quotation->request->status!=='approved') throw ValidationException::withMessages(['status'=>'Hanya procurement request approved yang dapat dibuat Purchase Order.']);
            ProcurementQuotation::where('procurement_request_id',$quotation->procurement_request_id)->update(['is_selected'=>false]);
            $quotation->update(['is_selected'=>true]);
            $order=PurchaseOrder::create([
                'order_number'=>$this->number('PO'),'procurement_request_id'=>$quotation->procurement_request_id,'procurement_quotation_id'=>$quotation->id,
                'supplier_id'=>$quotation->supplier_id,'status'=>'draft','order_date'=>now()->toDateString(),'total_amount'=>$quotation->total_amount,'created_by'=>$userId,
            ]);
            foreach($quotation->items as $quoteItem){
                $r=$quoteItem->requestItem;
                PurchaseOrderItem::create([
                    'purchase_order_id'=>$order->id,'procurement_request_item_id'=>$r->id,'item_kind'=>$r->item_kind,'inventory_item_id'=>$r->inventory_item_id,
                    'asset_category_id'=>$r->asset_category_id,'item_name'=>$r->item_name,'specification'=>$r->specification,'quantity'=>$quoteItem->quantity,
                    'unit_price'=>$quoteItem->unit_price,'received_quantity'=>0,
                ]);
            }
            $quotation->request->update(['status'=>'ordered']);
            return $order->fresh(['supplier','items.inventoryItem','items.assetCategory']);
        });
    }

    public function receive(PurchaseOrder $purchaseOrder, array $payload, int $userId): ProcurementReceipt
    {
        return DB::transaction(function() use($purchaseOrder,$payload,$userId){
            $order=PurchaseOrder::with(['items','request'])->lockForUpdate()->findOrFail($purchaseOrder->id);
            if(!in_array($order->status,['issued','partially_received'],true)) throw ValidationException::withMessages(['status'=>'Purchase Order harus berstatus issued / partially received sebelum penerimaan.']);
            $receipt=ProcurementReceipt::create(['receipt_number'=>$this->number('RCV'),'purchase_order_id'=>$order->id,'warehouse_id'=>$payload['warehouse_id']??null,'received_date'=>$payload['received_date'],'notes'=>$payload['notes']??null,'received_by'=>$userId]);
            foreach($payload['items'] as $input){
                $item=$order->items->firstWhere('id',(int)$input['purchase_order_item_id']);
                if(!$item) throw ValidationException::withMessages(['items'=>'Item Purchase Order tidak valid.']);
                $qty=(float)$input['quantity_received']; $remaining=(float)$item->quantity-(float)$item->received_quantity;
                if($qty<=0 || $qty>$remaining) throw ValidationException::withMessages(['quantity_received'=>"Qty penerimaan {$item->item_name} melebihi sisa PO ({$remaining})."]);
                ProcurementReceiptItem::create(['procurement_receipt_id'=>$receipt->id,'purchase_order_item_id'=>$item->id,'quantity_received'=>$qty]);
                if($item->item_kind==='inventory') {
                    if(!$payload['warehouse_id']) throw ValidationException::withMessages(['warehouse_id'=>'Gudang wajib dipilih untuk penerimaan barang inventory.']);
                    if(!$item->inventory_item_id) throw ValidationException::withMessages(['inventory_item_id'=>"{$item->item_name} belum terhubung ke Item Master Inventory."]);
                    $this->stockService->stockIn($item->inventory_item_id,(int)$payload['warehouse_id'],$qty,$userId,$order->supplier_id,"Penerimaan procurement {$order->order_number}",'purchase_order',$order->id);
                } else {
                    if(floor($qty)!=$qty) throw ValidationException::withMessages(['quantity_received'=>'Qty penerimaan asset / alkes harus bilangan bulat.']);
                    if(!$item->asset_category_id) throw ValidationException::withMessages(['asset_category_id'=>"{$item->item_name} belum memiliki kategori asset."]);
                    for($i=0;$i<(int)$qty;$i++) {
                        Asset::create([
                            'asset_code'=>$this->assetCode($item->item_kind),'name'=>$item->item_name,'asset_category_id'=>$item->asset_category_id,
                            'asset_type'=>$item->item_kind==='medical_equipment'?'medical_equipment':'general_asset','supplier_id'=>$order->supplier_id,
                            'unit_id'=>$order->request?->unit_id,'acquisition_date'=>$payload['received_date'],'acquisition_cost'=>$item->unit_price,'condition'=>'good','status'=>'available',
                            'calibration_required'=>$item->item_kind==='medical_equipment','notes'=>"Auto-created dari procurement {$order->order_number}",'is_active'=>true,'created_by'=>$userId,'updated_by'=>$userId,
                        ]);
                    }
                }
                $item->update(['received_quantity'=>(float)$item->received_quantity+$qty]);
            }
            $order->refresh(); $allReceived=$order->items()->get()->every(fn($i)=>(float)$i->received_quantity >= (float)$i->quantity);
            $order->update(['status'=>$allReceived?'received':'partially_received']);
            if($order->request) $order->request->update(['status'=>$allReceived?'completed':'partially_received']);
            return $receipt->fresh(['order.supplier','warehouse','items.orderItem']);
        });
    }

    private function number(string $prefix): string { return sprintf('PRC-%s-%s-%s',$prefix,now()->format('YmdHis'),strtoupper(bin2hex(random_bytes(2)))); }
    private function assetCode(string $kind): string { return sprintf('%s-%s-%s',$kind==='medical_equipment'?'ALK':'AST',now()->format('YmdHis'),strtoupper(bin2hex(random_bytes(3)))); }
}
