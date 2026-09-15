<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class AssetCategory extends Model {
    protected $fillable=['code','name','asset_type','description','is_active','created_by','updated_by'];
    protected function casts(): array { return ['is_active'=>'boolean']; }
    public function assets(): HasMany { return $this->hasMany(Asset::class); }
}
