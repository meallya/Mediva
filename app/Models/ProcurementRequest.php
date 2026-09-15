<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class ProcurementRequest extends Model {
    protected $fillable=['request_number','unit_id','status','notes','rejection_reason','requested_by','approved_by','approved_at'];
    protected function casts(): array { return ['approved_at'=>'datetime']; }
    public function unit(): BelongsTo { return $this->belongsTo(Unit::class); }
    public function requestedBy(): BelongsTo { return $this->belongsTo(User::class,'requested_by'); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class,'approved_by'); }
    public function items(): HasMany { return $this->hasMany(ProcurementRequestItem::class); }
    public function quotations(): HasMany { return $this->hasMany(ProcurementQuotation::class); }
    public function purchaseOrders(): HasMany { return $this->hasMany(PurchaseOrder::class); }
}
