<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Asset extends Model {
    protected $fillable=['asset_code','name','asset_category_id','asset_type','supplier_id','unit_id','room_id','serial_number','brand','model','acquisition_date','acquisition_cost','warranty_until','condition','status','calibration_required','last_calibration_date','next_calibration_date','medical_device_registration','risk_class','notes','is_active','created_by','updated_by'];
    protected function casts(): array { return ['acquisition_date'=>'date','warranty_until'=>'date','last_calibration_date'=>'date','next_calibration_date'=>'date','acquisition_cost'=>'decimal:2','calibration_required'=>'boolean','is_active'=>'boolean']; }
    public function category(): BelongsTo { return $this->belongsTo(AssetCategory::class,'asset_category_id'); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function unit(): BelongsTo { return $this->belongsTo(Unit::class); }
    public function room(): BelongsTo { return $this->belongsTo(Room::class); }
    public function maintenances(): HasMany { return $this->hasMany(AssetMaintenance::class); }
    public function mutations(): HasMany { return $this->hasMany(AssetMutation::class); }
}
