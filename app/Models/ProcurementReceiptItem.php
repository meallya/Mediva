<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ProcurementReceiptItem extends Model {
    protected $fillable=['procurement_receipt_id','purchase_order_item_id','quantity_received'];
    protected function casts(): array { return ['quantity_received'=>'decimal:2']; }
    public function receipt(): BelongsTo { return $this->belongsTo(ProcurementReceipt::class,'procurement_receipt_id'); }
    public function orderItem(): BelongsTo { return $this->belongsTo(PurchaseOrderItem::class,'purchase_order_item_id'); }
}
