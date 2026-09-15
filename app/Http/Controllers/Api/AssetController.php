<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetMaintenance;
use App\Models\AssetMutation;
use App\Models\Room;
use App\Models\Supplier;
use App\Models\Unit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AssetController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json(['data' => [
            'summary' => [
                'active_assets' => Asset::where('is_active', true)->count(),
                'medical_equipment' => Asset::where('is_active', true)->where('asset_type', 'medical_equipment')->count(),
                'maintenance_assets' => Asset::where('status', 'maintenance')->count(),
                'damaged_assets' => Asset::whereIn('condition', ['minor_damage', 'major_damage', 'out_of_service'])->count(),
                'calibration_due' => Asset::where('calibration_required', true)->whereNotNull('next_calibration_date')->whereDate('next_calibration_date', '<=', now()->addDays(30))->count(),
            ],
            'recent_assets' => Asset::with(['category:id,code,name','unit:id,code,name','room:id,code,name'])->latest('id')->limit(8)->get(),
        ]]);
    }

    public function options(): JsonResponse
    {
        return response()->json(['data' => [
            'categories' => AssetCategory::where('is_active', true)->orderBy('name')->get(['id','code','name','asset_type']),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(['id','code','name']),
            'rooms' => Room::where('is_active', true)->orderBy('name')->get(['id','code','name','unit_id','room_type']),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id','code','name']),
            'assets' => Asset::where('is_active', true)->orderBy('name')->get(['id','asset_code','name','unit_id','room_id','asset_type']),
        ]]);
    }

    public function categories(): JsonResponse
    {
        return response()->json(['data' => AssetCategory::orderBy('name')->get()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data=$request->validate([
            'code'=>['required','string','max:50','unique:asset_categories,code'],
            'name'=>['required','string','max:150'],
            'asset_type'=>['required',Rule::in(['general_asset','medical_equipment'])],
            'description'=>['nullable','string','max:2000'],
            'is_active'=>['sometimes','boolean'],
        ]);
        $data['code']=Str::upper(trim($data['code'])); $data['name']=trim($data['name']);
        $data['is_active']=$data['is_active']??true; $data['created_by']=$request->user()->id; $data['updated_by']=$request->user()->id;
        $row=AssetCategory::create($data);
        AuditLogger::log($request,'asset.category.create','asset',"Tambah kategori aset {$row->code}",newValues:$row->toArray());
        return response()->json(['message'=>'Kategori aset berhasil ditambahkan.','data'=>$row],201);
    }

    public function updateCategory(Request $request, AssetCategory $assetCategory): JsonResponse
    {
        $data=$request->validate([
            'code'=>['required','string','max:50',Rule::unique('asset_categories','code')->ignore($assetCategory->id)],
            'name'=>['required','string','max:150'],
            'asset_type'=>['required',Rule::in(['general_asset','medical_equipment'])],
            'description'=>['nullable','string','max:2000'],
            'is_active'=>['sometimes','boolean'],
        ]);
        $old=$assetCategory->toArray(); $data['code']=Str::upper(trim($data['code'])); $data['name']=trim($data['name']); $data['updated_by']=$request->user()->id;
        $assetCategory->update($data);
        AuditLogger::log($request,'asset.category.update','asset',"Ubah kategori aset {$assetCategory->code}",oldValues:$old,newValues:$assetCategory->fresh()->toArray());
        return response()->json(['message'=>'Kategori aset berhasil diperbarui.','data'=>$assetCategory->fresh()]);
    }

    public function index(Request $request): JsonResponse
    {
        $search=trim((string)$request->query('search','')); $type=(string)$request->query('asset_type','all'); $status=(string)$request->query('status','all');
        $perPage=min(max((int)$request->query('per_page',10),5),100);
        $q=Asset::with(['category:id,code,name,asset_type','supplier:id,code,name','unit:id,code,name','room:id,code,name']);
        if($search!=='') $q->where(fn($x)=>$x->where('asset_code','like',"%{$search}%")->orWhere('name','like',"%{$search}%")->orWhere('serial_number','like',"%{$search}%")->orWhere('brand','like',"%{$search}%"));
        if($type!=='all') $q->where('asset_type',$type); if($status!=='all') $q->where('status',$status);
        return response()->json($q->latest('id')->paginate($perPage)->withQueryString());
    }

    public function store(Request $request): JsonResponse
    {
        $data=$this->validateAsset($request);
        $data['asset_code']=Str::upper(trim($data['asset_code'])); $data['name']=trim($data['name']); $data['created_by']=$request->user()->id; $data['updated_by']=$request->user()->id; $data['is_active']=$data['is_active']??true;
        $asset=Asset::create($data)->load(['category','supplier','unit','room']);
        AuditLogger::log($request,'asset.create','asset',"Tambah aset {$asset->asset_code} - {$asset->name}",newValues:$asset->toArray());
        return response()->json(['message'=>'Aset berhasil ditambahkan.','data'=>$asset],201);
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $data=$this->validateAsset($request,$asset); $old=$asset->toArray();
        $data['asset_code']=Str::upper(trim($data['asset_code'])); $data['name']=trim($data['name']); $data['updated_by']=$request->user()->id;
        $asset->update($data); $asset=$asset->fresh()->load(['category','supplier','unit','room']);
        AuditLogger::log($request,'asset.update','asset',"Ubah aset {$asset->asset_code}",oldValues:$old,newValues:$asset->toArray());
        return response()->json(['message'=>'Aset berhasil diperbarui.','data'=>$asset]);
    }

    public function toggleStatus(Request $request, Asset $asset): JsonResponse
    {
        $data=$request->validate(['is_active'=>['required','boolean']]); $old=['is_active'=>$asset->is_active];
        $asset->update(['is_active'=>$data['is_active'],'updated_by'=>$request->user()->id]);
        AuditLogger::log($request,'asset.status','asset',"Ubah status master aset {$asset->asset_code}",oldValues:$old,newValues:['is_active'=>$asset->is_active]);
        return response()->json(['message'=>'Status aset berhasil diperbarui.','data'=>$asset]);
    }

    public function maintenances(Request $request): JsonResponse
    {
        $q=AssetMaintenance::with(['asset:id,asset_code,name','supplier:id,code,name'])->latest('id');
        if($request->query('asset_id')) $q->where('asset_id',$request->query('asset_id'));
        return response()->json($q->paginate(min(max((int)$request->query('per_page',10),5),100)));
    }

    public function storeMaintenance(Request $request): JsonResponse
    {
        $data=$request->validate([
            'asset_id'=>['required','integer','exists:assets,id'],
            'maintenance_type'=>['required',Rule::in(['preventive','corrective','calibration','inspection'])],
            'status'=>['required',Rule::in(['scheduled','in_progress','completed','cancelled'])],
            'scheduled_date'=>['nullable','date'],'performed_date'=>['nullable','date'],'next_due_date'=>['nullable','date'],
            'supplier_id'=>['nullable','integer','exists:suppliers,id'],'cost'=>['nullable','numeric','min:0'],'notes'=>['nullable','string','max:3000'],
        ]);
        $data['cost']=$data['cost']??0; $data['created_by']=$request->user()->id;
        $maintenance=DB::transaction(function() use($data,$request){
            $row=AssetMaintenance::create($data); $asset=Asset::findOrFail($data['asset_id']);
            if($data['status']==='in_progress') $asset->update(['status'=>'maintenance','updated_by'=>$request->user()->id]);
            if($data['status']==='completed') {
                $updates=['status'=>'available','updated_by'=>$request->user()->id];
                if($data['maintenance_type']==='calibration') { $updates['last_calibration_date']=$data['performed_date']??now()->toDateString(); $updates['next_calibration_date']=$data['next_due_date']??null; }
                $asset->update($updates);
            }
            return $row->load(['asset','supplier']);
        });
        AuditLogger::log($request,'asset.maintenance.create','asset',"Catat maintenance aset {$maintenance->asset?->asset_code}",newValues:$maintenance->toArray());
        return response()->json(['message'=>'Maintenance aset berhasil dicatat.','data'=>$maintenance],201);
    }

    public function mutate(Request $request, Asset $asset): JsonResponse
    {
        $data=$request->validate(['to_unit_id'=>['nullable','integer','exists:units,id'],'to_room_id'=>['nullable','integer','exists:rooms,id'],'mutation_date'=>['required','date'],'notes'=>['nullable','string','max:2000']]);
        if(empty($data['to_unit_id']) && empty($data['to_room_id'])) throw ValidationException::withMessages(['location'=>'Pilih minimal unit atau ruangan tujuan.']);
        $mutation=DB::transaction(function() use($asset,$data,$request){
            $row=AssetMutation::create(['asset_id'=>$asset->id,'from_unit_id'=>$asset->unit_id,'to_unit_id'=>$data['to_unit_id']??null,'from_room_id'=>$asset->room_id,'to_room_id'=>$data['to_room_id']??null,'mutation_date'=>$data['mutation_date'],'notes'=>$data['notes']??null,'created_by'=>$request->user()->id]);
            $asset->update(['unit_id'=>$data['to_unit_id']??null,'room_id'=>$data['to_room_id']??null,'updated_by'=>$request->user()->id]); return $row->load(['asset','fromUnit','toUnit','fromRoom','toRoom']);
        });
        AuditLogger::log($request,'asset.mutation','asset',"Mutasi aset {$asset->asset_code}",newValues:$mutation->toArray());
        return response()->json(['message'=>'Mutasi aset berhasil dicatat.','data'=>$mutation]);
    }

    public function mutations(Request $request): JsonResponse
    {
        $q=AssetMutation::with(['asset:id,asset_code,name','fromUnit:id,code,name','toUnit:id,code,name','fromRoom:id,code,name','toRoom:id,code,name'])->latest('id');
        if($request->query('asset_id')) $q->where('asset_id',$request->query('asset_id'));
        return response()->json($q->paginate(min(max((int)$request->query('per_page',10),5),100)));
    }

    private function validateAsset(Request $request, ?Asset $asset=null): array
    {
        return $request->validate([
            'asset_code'=>['required','string','max:80',Rule::unique('assets','asset_code')->ignore($asset?->id)],
            'name'=>['required','string','max:200'],'asset_category_id'=>['required','integer','exists:asset_categories,id'],
            'asset_type'=>['required',Rule::in(['general_asset','medical_equipment'])],
            'supplier_id'=>['nullable','integer','exists:suppliers,id'],'unit_id'=>['nullable','integer','exists:units,id'],'room_id'=>['nullable','integer','exists:rooms,id'],
            'serial_number'=>['nullable','string','max:150',Rule::unique('assets','serial_number')->ignore($asset?->id)],
            'brand'=>['nullable','string','max:120'],'model'=>['nullable','string','max:120'],'acquisition_date'=>['nullable','date'],'acquisition_cost'=>['nullable','numeric','min:0'],'warranty_until'=>['nullable','date'],
            'condition'=>['required',Rule::in(['good','minor_damage','major_damage','out_of_service'])],
            'status'=>['required',Rule::in(['available','in_use','maintenance','retired','disposed'])],
            'calibration_required'=>['sometimes','boolean'],'last_calibration_date'=>['nullable','date'],'next_calibration_date'=>['nullable','date'],
            'medical_device_registration'=>['nullable','string','max:150'],'risk_class'=>['nullable','string','max:50'],'notes'=>['nullable','string','max:3000'],'is_active'=>['sometimes','boolean'],
        ]);
    }
}
