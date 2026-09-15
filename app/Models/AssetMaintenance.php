<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class AssetMaintenance extends Model {
    protected $fillable=['asset_id','maintenance_type','status','scheduled_date','performed_date','next_due_date','supplier_id','cost','notes','created_by'];
    protected function casts(): array { return ['scheduled_date'=>'date','performed_date'=>'date','next_due_date'=>'date','cost'=>'decimal:2']; }
    public function asset(): BelongsTo { return $this->belongsTo(Asset::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
}
