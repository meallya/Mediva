<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class OperationalHospitalPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions=[
            ['name'=>'Lihat Asset & Alkes','slug'=>'asset.view','module'=>'asset'],
            ['name'=>'Kelola Asset & Alkes','slug'=>'asset.manage','module'=>'asset'],
            ['name'=>'Mutasi Asset','slug'=>'asset.transfer','module'=>'asset'],
            ['name'=>'Maintenance & Kalibrasi Asset','slug'=>'asset.maintenance','module'=>'asset'],
            ['name'=>'Lihat Procurement','slug'=>'procurement.view','module'=>'procurement'],
            ['name'=>'Buat Purchase Request','slug'=>'procurement.request','module'=>'procurement'],
            ['name'=>'Approve Purchase Request','slug'=>'procurement.approve','module'=>'procurement'],
            ['name'=>'Kelola Quotation & Purchase Order','slug'=>'procurement.manage','module'=>'procurement'],
            ['name'=>'Penerimaan Procurement','slug'=>'procurement.receive','module'=>'procurement'],
        ];
        foreach($permissions as $p) Permission::updateOrCreate(['slug'=>$p['slug']],$p);
        $ids=Permission::whereIn('slug',collect($permissions)->pluck('slug'))->pluck('id')->all();
        $it=Role::where('slug','it')->first(); if($it) $it->permissions()->syncWithoutDetaching($ids);
        foreach(['management'] as $slug){ $r=Role::where('slug',$slug)->first(); if($r){ $view=Permission::whereIn('slug',['asset.view','procurement.view'])->pluck('id')->all(); $r->permissions()->syncWithoutDetaching($view); } }
        foreach(['warehouse','procurement'] as $slug){ $r=Role::where('slug',$slug)->first(); if($r) $r->permissions()->syncWithoutDetaching($ids); }
    }
}
