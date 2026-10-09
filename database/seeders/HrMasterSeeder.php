<?php
namespace Database\Seeders;

use App\Models\{HrContractType,HrEducationLevel,HrEmploymentStatus,HrGrade,HrLeaveType,HrPosition,HrProfession,HrShift};
use Illuminate\Database\Seeder;

class HrMasterSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([['PERMANENT','Pegawai Tetap'],['CONTRACT','Pegawai Kontrak'],['INTERN','Magang'],['OUTSOURCE','Outsourcing'],['PARTNER_DOCTOR','Dokter Mitra'],['DAILY','Tenaga Harian / Freelance']] as [$code,$name]) HrEmploymentStatus::updateOrCreate(compact('code'), compact('name') + ['is_active'=>true]);
        foreach ([['DIRUT','Direktur Utama'],['MANAGER','Manager'],['HEAD_UNIT','Kepala Unit'],['STAFF','Staff'],['DOCTOR','Dokter'],['NURSE','Perawat'],['PHARMACIST','Apoteker'],['MIDWIFE','Bidan']] as [$code,$name]) HrPosition::updateOrCreate(compact('code'), compact('name') + ['is_active'=>true]);
        foreach ([['DOCTOR','Dokter',1,1,1],['NURSE','Perawat',1,1,1],['PHARMACIST','Apoteker',1,1,1],['MIDWIFE','Bidan',1,1,1],['LAB','Tenaga Laboratorium',1,1,0],['RAD','Radiografer',1,1,0],['IT','Teknologi Informasi',0,0,0],['ADMIN','Administrasi',0,0,0],['FINANCE','Keuangan',0,0,0],['HR','SDM / HR',0,0,0]] as [$code,$name,$health,$str,$sip]) HrProfession::updateOrCreate(compact('code'), ['name'=>$name,'is_health_worker'=>$health,'requires_str'=>$str,'requires_sip'=>$sip,'is_active'=>true]);
        foreach ([['G1','Golongan I'],['G2','Golongan II'],['G3','Golongan III'],['G4','Golongan IV']] as [$code,$name]) HrGrade::updateOrCreate(compact('code'), compact('name') + ['is_active'=>true]);
        foreach ([['SMA','SMA / Sederajat',1],['D3','Diploma III',2],['D4','Diploma IV',3],['S1','Sarjana / S1',4],['PROF','Profesi',5],['S2','Magister / S2',6],['S3','Doktor / S3',7]] as [$code,$name,$level_order]) HrEducationLevel::updateOrCreate(compact('code'), compact('name','level_order') + ['is_active'=>true]);
        foreach ([['PERMANENT','Tetap'],['PKWT','PKWT'],['MITRA','Mitra'],['INTERNSHIP','Magang'],['OUTSOURCE','Outsourcing']] as [$code,$name]) HrContractType::updateOrCreate(compact('code'), compact('name') + ['is_active'=>true]);
        foreach ([['ANNUAL','Cuti Tahunan',12],['MATERNITY','Cuti Melahirkan',0],['MARRIAGE','Cuti Menikah',0],['IMPORTANT','Cuti Alasan Penting',0]] as [$code,$name,$default_quota]) HrLeaveType::updateOrCreate(compact('code'), compact('name','default_quota') + ['deduct_quota'=>$code==='ANNUAL','requires_attachment'=>false,'is_active'=>true]);
        foreach ([['MORNING','Shift Pagi','07:00:00','14:00:00',0],['AFTERNOON','Shift Siang','14:00:00','21:00:00',0],['NIGHT','Shift Malam','21:00:00','07:00:00',1],['OFFICE','Jam Kantor','08:00:00','16:00:00',0]] as [$code,$name,$start_time,$end_time,$cross_day]) HrShift::updateOrCreate(compact('code'), compact('name','start_time','end_time','cross_day') + ['tolerance_minutes'=>15,'is_active'=>true]);
    }
}
