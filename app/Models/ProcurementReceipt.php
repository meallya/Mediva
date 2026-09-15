<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class ProcurementReceipt extends Model {
    protected $fillable=['receipt_number','purchase_order_id','warehouse_id','received_date','notes','received_by'];
    protected function casts(): array { return ['received_date'=>'date']; }
    public function order(): BelongsTo { return $this->belongsTo(PurchaseOrder::class,'purchase_order_id'); }
    public function warehouse(): BelongsTo { return $this->belongsTo(InventoryWarehouse::class,'warehouse_id'); }
    public function receivedBy(): BelongsTo { return $this->belongsTo(User::class,'received_by'); }
    public function items(): HasMany { return $this->hasMany(ProcurementReceiptItem::class); }
}
