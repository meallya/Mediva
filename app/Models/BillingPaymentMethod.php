<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/*
|--------------------------------------------------------------------------
| BILLING PAYMENT METHOD (READ-ONLY RELATION MODEL)
|--------------------------------------------------------------------------
|
| Model kecil ini sengaja dipisahkan dari Master PaymentMethod milik project.
| Tujuannya agar modul Billing tidak bergantung pada bentuk controller/model
| Master Data yang mungkin sudah ada pada MEDIVA.
|
| Semua CRUD metode pembayaran tetap dikelola sesuai modul Master Data.
| Billing hanya membutuhkan relasi untuk menampilkan nama metode bayar.
|
*/

class BillingPaymentMethod extends Model
{
    protected $table = 'payment_methods';

    protected $guarded = [];
}
