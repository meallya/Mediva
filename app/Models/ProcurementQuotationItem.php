<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ProcurementQuotationItem extends Model {
    protected $fillable=['procurement_quotation_id','procurement_request_item_id','quantity','unit_price','line_total'];
    protected function casts(): array { return ['quantity'=>'decimal:2','unit_price'=>'decimal:2','line_total'=>'decimal:2']; }
    public function quotation(): BelongsTo { return $this->belongsTo(ProcurementQuotation::class,'procurement_quotation_id'); }
    public function requestItem(): BelongsTo { return $this->belongsTo(ProcurementRequestItem::class,'procurement_request_item_id'); }
}
