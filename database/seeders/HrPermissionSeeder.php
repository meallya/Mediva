<?php
namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class HrPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['Lihat Dashboard HR','hr.dashboard.view'],['Lihat Pegawai','hr.employee.view'],['Kelola Pegawai','hr.employee.manage'],['Kelola Master HR','hr.master.manage'],
            ['Lihat Jadwal','hr.schedule.view'],['Kelola Jadwal','hr.schedule.manage'],['Lihat Kehadiran','hr.attendance.view'],['Kelola Kehadiran','hr.attendance.manage'],
            ['Ajukan Cuti/Izin','hr.absence.request'],['Approve Cuti/Izin','hr.absence.approve'],['Ajukan Lembur','hr.overtime.request'],['Approve Lembur','hr.overtime.approve'],
            ['Kelola Kontrak','hr.contract.manage'],['Kelola Kredensial','hr.credential.manage'],['Kelola Kinerja','hr.performance.manage'],['Kelola Pelatihan','hr.training.manage'],
            ['Kelola Dokumen','hr.document.manage'],['Kelola Disiplin','hr.discipline.manage'],['Proses Offboarding','hr.offboarding.manage'],['Lihat Laporan HR','hr.report.view'],
        ];
        $ids=[]; foreach($rows as [$name,$slug]) $ids[] = Permission::updateOrCreate(['slug'=>$slug],['name'=>$name,'module'=>'hr'])->id;
        $role = Role::updateOrCreate(['slug'=>'hr'],['name'=>'HR / SDM','description'=>'Pengelolaan sumber daya manusia MEDIVA','is_active'=>true]);
        $role->permissions()->syncWithoutDetaching($ids);
    }
}
