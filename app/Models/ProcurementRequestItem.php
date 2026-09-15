<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ProcurementRequestItem extends Model {
    protected $fillable=['procurement_request_id','item_kind','inventory_item_id','asset_category_id','item_name','specification','quantity','estimated_unit_price'];
    protected function casts(): array { return ['quantity'=>'decimal:2','estimated_unit_price'=>'decimal:2']; }
    public function request(): BelongsTo { return $this->belongsTo(ProcurementRequest::class,'procurement_request_id'); }
    public function inventoryItem(): BelongsTo { return $this->belongsTo(InventoryItem::class); }
    public function assetCategory(): BelongsTo { return $this->belongsTo(AssetCategory::class); }
}
