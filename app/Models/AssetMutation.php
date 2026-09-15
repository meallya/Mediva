<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class AssetMutation extends Model {
    protected $fillable=['asset_id','from_unit_id','to_unit_id','from_room_id','to_room_id','mutation_date','notes','created_by'];
    protected function casts(): array { return ['mutation_date'=>'date']; }
    public function asset(): BelongsTo { return $this->belongsTo(Asset::class); }
    public function fromUnit(): BelongsTo { return $this->belongsTo(Unit::class,'from_unit_id'); }
    public function toUnit(): BelongsTo { return $this->belongsTo(Unit::class,'to_unit_id'); }
    public function fromRoom(): BelongsTo { return $this->belongsTo(Room::class,'from_room_id'); }
    public function toRoom(): BelongsTo { return $this->belongsTo(Room::class,'to_room_id'); }
}
