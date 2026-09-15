<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class ProcurementQuotation extends Model {
    protected $fillable=['procurement_request_id','supplier_id','quotation_number','quotation_date','total_amount','notes','is_selected','created_by'];
    protected function casts(): array { return ['quotation_date'=>'date','total_amount'=>'decimal:2','is_selected'=>'boolean']; }
    public function request(): BelongsTo { return $this->belongsTo(ProcurementRequest::class,'procurement_request_id'); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function items(): HasMany { return $this->hasMany(ProcurementQuotationItem::class); }
    public function purchaseOrders(): HasMany { return $this->hasMany(PurchaseOrder::class); }
}
