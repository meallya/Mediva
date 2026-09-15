<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class PurchaseOrder extends Model {
    protected $fillable=['order_number','procurement_request_id','procurement_quotation_id','supplier_id','status','order_date','expected_date','total_amount','notes','created_by'];
    protected function casts(): array { return ['order_date'=>'date','expected_date'=>'date','total_amount'=>'decimal:2']; }
    public function request(): BelongsTo { return $this->belongsTo(ProcurementRequest::class,'procurement_request_id'); }
    public function quotation(): BelongsTo { return $this->belongsTo(ProcurementQuotation::class,'procurement_quotation_id'); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function items(): HasMany { return $this->hasMany(PurchaseOrderItem::class); }
    public function receipts(): HasMany { return $this->hasMany(ProcurementReceipt::class); }
}
