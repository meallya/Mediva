<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\InpatientRoomController;
use App\Http\Controllers\Api\MedicalCodingController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\PharmacyInventoryController;
use App\Http\Controllers\Api\PharmacyPrescriptionActionController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\TariffController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\GeneralInventoryController;
use App\Http\Controllers\Api\LaboratoryController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\ProcurementController;
use App\Http\Controllers\Api\OperatingRoomController;
use App\Http\Controllers\Api\OperatingRoomMasterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
|
| Login berada di luar auth:sanctum karena user belum login.
|
*/

Route::post(
    '/auth/login',
    [
        AuthController::class,
        'login',
    ]
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware(
    'auth:sanctum'
)->group(function () {

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/auth/me',
        [
            AuthController::class,
            'me',
        ]
    );

    Route::post(
        '/auth/switch-role',
        [
            AuthController::class,
            'switchRole',
        ]
    );

    Route::post(
        '/auth/logout',
        [
            AuthController::class,
            'logout',
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | PATIENT
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/patients',
        [
            PatientController::class,
            'index',
        ]
    )->middleware(
        'permission:patient.view'
    );

    Route::post(
        '/patients',
        [
            PatientController::class,
            'store',
        ]
    )->middleware(
        'permission:patient.create'
    );

    Route::get(
        '/patients/{patient}',
        [
            PatientController::class,
            'show',
        ]
    )->middleware(
        'permission:patient.view'
    );

    Route::put(
        '/patients/{patient}',
        [
            PatientController::class,
            'update',
        ]
    )->middleware(
        'permission:patient.update'
    );

    Route::delete(
    '/patients/{patient}',
    [
        PatientController::class,
        'destroy',
    ]
)->middleware(
    'permission:patient.delete'
);

    /*
    |--------------------------------------------------------------------------
    | REGISTRATION
    |--------------------------------------------------------------------------
    |
    | OPTIONS HARUS sebelum {registration}.
    |
    */

    Route::get(
        '/registrations/options',
        [
            RegistrationController::class,
            'options',
        ]
    )->middleware(
        'permission:registration.view'
    );

    Route::get(
        '/registrations',
        [
            RegistrationController::class,
            'index',
        ]
    )->middleware(
        'permission:registration.view'
    );

    Route::post(
        '/registrations',
        [
            RegistrationController::class,
            'store',
        ]
    )->middleware(
        'permission:registration.create'
    );

    Route::get(
        '/registrations/{registration}',
        [
            RegistrationController::class,
            'show',
        ]
    )->middleware(
        'permission:registration.view'
    );

    Route::put(
        '/registrations/{registration}',
        [
            RegistrationController::class,
            'update',
        ]
    )->middleware(
        'permission:registration.update'
    );

    Route::patch(
        '/registrations/{registration}/cancel',
        [
            RegistrationController::class,
            'cancel',
        ]
    )->middleware(
        'permission:registration.cancel'
    );

    Route::patch(
        '/registrations/{registration}/start-service',
        [
            RegistrationController::class,
            'startService',
        ]
    )->middleware(
        'permission:registration.start_service'
    );

    Route::patch(
        '/registrations/{registration}/complete-service',
        [
            RegistrationController::class,
            'completeService',
        ]
    )->middleware(
        'permission:registration.complete_service'
    );

    /*
    |--------------------------------------------------------------------------
    | QUEUE
    |--------------------------------------------------------------------------
    |
    | OPTIONS HARUS sebelum {queue}.
    |
    */

    Route::get(
        '/queues/options',
        [
            QueueController::class,
            'options',
        ]
    )->middleware(
        'permission:queue.view'
    );

    Route::get(
        '/queues',
        [
            QueueController::class,
            'index',
        ]
    )->middleware(
        'permission:queue.view'
    );

    Route::get(
        '/queues/{queue}',
        [
            QueueController::class,
            'show',
        ]
    )->middleware(
        'permission:queue.view'
    );

    Route::patch(
        '/queues/{queue}/call',
        [
            QueueController::class,
            'call',
        ]
    )->middleware(
        'permission:queue.call'
    );

    Route::patch(
        '/queues/{queue}/start-service',
        [
            QueueController::class,
            'startService',
        ]
    )->middleware(
        'permission:queue.start_service'
    );

    Route::patch(
        '/queues/{queue}/complete',
        [
            QueueController::class,
            'completeQueue',
        ]
    )->middleware(
        'permission:queue.complete'
    );

    /*
    |--------------------------------------------------------------------------
    | MASTER DATA
    |--------------------------------------------------------------------------
    |
    | HANYA IT / role yang punya user.manage.
    |
    | PENTING:
    | Group ini BERHENTI sebelum Medical Examination.
    |
    */

    Route::middleware(
        'permission:user.manage'
    )->group(function () {

        /*
        |--------------------------------------------------------------------------
        | EMPLOYEE
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/master/employees',
            [
                EmployeeController::class,
                'index',
            ]
        );

        Route::post(
            '/master/employees',
            [
                EmployeeController::class,
                'store',
            ]
        );

        Route::get(
            '/master/employees/{employee}',
            [
                EmployeeController::class,
                'show',
            ]
        );

        Route::put(
            '/master/employees/{employee}',
            [
                EmployeeController::class,
                'update',
            ]
        );

        Route::patch(
            '/master/employees/{employee}/status',
            [
                EmployeeController::class,
                'toggleStatus',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOCTOR MASTER
        |--------------------------------------------------------------------------
        |
        | OPTIONS HARUS sebelum {doctor}.
        |
        */

        Route::get(
            '/master/doctors/options',
            [
                DoctorController::class,
                'options',
            ]
        );

        Route::get(
            '/master/doctors',
            [
                DoctorController::class,
                'index',
            ]
        );

        Route::post(
            '/master/doctors',
            [
                DoctorController::class,
                'store',
            ]
        );

        Route::get(
            '/master/doctors/{doctor}',
            [
                DoctorController::class,
                'show',
            ]
        );

        Route::put(
            '/master/doctors/{doctor}',
            [
                DoctorController::class,
                'update',
            ]
        );

        Route::patch(
            '/master/doctors/{doctor}/status',
            [
                DoctorController::class,
                'toggleStatus',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | CLINIC / POLI
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/master/clinics',
            [
                ClinicController::class,
                'index',
            ]
        );

        Route::post(
            '/master/clinics',
            [
                ClinicController::class,
                'store',
            ]
        );

        Route::get(
            '/master/clinics/{clinic}',
            [
                ClinicController::class,
                'show',
            ]
        );

        Route::put(
            '/master/clinics/{clinic}',
            [
                ClinicController::class,
                'update',
            ]
        );


        Route::patch(
            '/master/clinics/{clinic}/status',
            [
                ClinicController::class,
                'toggleStatus',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ROOM
        |--------------------------------------------------------------------------
        |
        | OPTIONS HARUS sebelum {room}.
        |
        */

        Route::get(
            '/master/rooms/options',
            [
                RoomController::class,
                'options',
            ]
        );

        Route::get(
            '/master/rooms',
            [
                RoomController::class,
                'index',
            ]
        );

        Route::post(
            '/master/rooms',
            [
                RoomController::class,
                'store',
            ]
        );

        Route::get(
            '/master/rooms/{room}',
            [
                RoomController::class,
                'show',
            ]
        );

        Route::put(
            '/master/rooms/{room}',
            [
                RoomController::class,
                'update',
            ]
        );

        Route::patch(
            '/master/rooms/{room}/status',
            [
                RoomController::class,
                'toggleStatus',
            ]
        );

        Route::delete(
            '/master/rooms/{room}',
            [
                RoomController::class,
                'destroy',
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | INPATIENT ROOM
        |--------------------------------------------------------------------------
        |
        | Kamar rawat inap adalah profil tambahan untuk rooms bertipe inpatient.
        | OPTIONS HARUS sebelum {inpatientRoom}.
        |
        */

        Route::get(
            '/master/inpatient-rooms/options',
            [
                InpatientRoomController::class,
                'options',
            ]
        );

        Route::get(
            '/master/inpatient-rooms',
            [
                InpatientRoomController::class,
                'index',
            ]
        );

        Route::post(
            '/master/inpatient-rooms',
            [
                InpatientRoomController::class,
                'store',
            ]
        );

        Route::get(
            '/master/inpatient-rooms/{inpatientRoom}',
            [
                InpatientRoomController::class,
                'show',
            ]
        );

        Route::put(
            '/master/inpatient-rooms/{inpatientRoom}',
            [
                InpatientRoomController::class,
                'update',
            ]
        );

        Route::patch(
            '/master/inpatient-rooms/{inpatientRoom}/status',
            [
                InpatientRoomController::class,
                'toggleStatus',
            ]
        );

        Route::delete(
            '/master/inpatient-rooms/{inpatientRoom}',
            [
                InpatientRoomController::class,
                'destroy',
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | PAYMENT METHOD
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/master/payment-methods',
            [
                PaymentMethodController::class,
                'index',
            ]
        );

        Route::post(
            '/master/payment-methods',
            [
                PaymentMethodController::class,
                'store',
            ]
        );

        Route::get(
            '/master/payment-methods/{paymentMethod}',
            [
                PaymentMethodController::class,
                'show',
            ]
        );

        Route::put(
            '/master/payment-methods/{paymentMethod}',
            [
                PaymentMethodController::class,
                'update',
            ]
        );

        Route::patch(
            '/master/payment-methods/{paymentMethod}/status',
            [
                PaymentMethodController::class,
                'toggleStatus',
            ]
        );

    }); // ================================================================
        // END permission:user.manage
        // ================================================================


    /*
    |--------------------------------------------------------------------------
    | GET VISIT + EXAMINATION
    |--------------------------------------------------------------------------
    |
    */

    Route::get(
        '/examinations/visit/{visit}',
        [
            ExaminationController::class,
            'showByVisit',
        ]
    )->middleware(
        'permission:examination.view'
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE EXAMINATION
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/examinations',
        [
            ExaminationController::class,
            'store',
        ]
    )->middleware(
        'permission:examination.create'
    );

    /*
    |--------------------------------------------------------------------------
    | DETAIL EXAMINATION
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/examinations/{examination}',
        [
            ExaminationController::class,
            'show',
        ]
    )->middleware(
        'permission:examination.view'
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE EXAMINATION
    |--------------------------------------------------------------------------
    */

    Route::put(
        '/examinations/{examination}',
        [
            ExaminationController::class,
            'update',
        ]
    )->middleware(
        'permission:examination.update'
    );

    /*
    |--------------------------------------------------------------------------
    | COMPLETE EXAMINATION
    |--------------------------------------------------------------------------
    */

    Route::patch(
        '/examinations/{examination}/complete',
        [
            ExaminationController::class,
            'complete',
        ]
    )->middleware(
        'permission:examination.complete'
    );

    /*
|--------------------------------------------------------------------------
| MEDICAL CODE SEARCH
|--------------------------------------------------------------------------
*/

Route::get(
    '/medical-codes/icd10',
    [
        MedicalCodingController::class,
        'searchIcd10',
    ]
)->middleware(
    'permission:examination.view'
);

Route::get(
    '/medical-codes/icd9cm',
    [
        MedicalCodingController::class,
        'searchIcd9cm',
    ]
)->middleware(
    'permission:examination.view'
);

/*
|--------------------------------------------------------------------------
| EXAMINATION CODING
|--------------------------------------------------------------------------
*/

Route::get(
    '/examinations/{examination}/coding',
    [
        MedicalCodingController::class,
        'show',
    ]
)->middleware(
    'permission:examination.view'
);

Route::post(
    '/examinations/{examination}/diagnoses',
    [
        MedicalCodingController::class,
        'addDiagnosis',
    ]
)->middleware(
    'permission:examination.update'
);

Route::delete(
    '/examinations/{examination}/diagnoses/{diagnosis}',
    [
        MedicalCodingController::class,
        'deleteDiagnosis',
    ]
)->middleware(
    'permission:examination.update'
);

Route::post(
    '/examinations/{examination}/procedures',
    [
        MedicalCodingController::class,
        'addProcedure',
    ]
)->middleware(
    'permission:examination.update'
);

Route::delete(
    '/examinations/{examination}/procedures/{procedure}',
    [
        MedicalCodingController::class,
        'deleteProcedure',
    ]
)->middleware(
    'permission:examination.update'
);

/*
|--------------------------------------------------------------------------
| MEDICAL RECORD
|--------------------------------------------------------------------------
*/

Route::get(
    '/medical-records/patients/{patient}',
    [
        MedicalRecordController::class,
        'showPatient',
    ]
)->middleware(
    'permission:medical_record.view'
);

/*
|--------------------------------------------------------------------------
| MEDICAL RECORD DETAIL
|--------------------------------------------------------------------------
*/

Route::get(
    '/medical-records/{medicalRecord}',
    [
        MedicalRecordController::class,
        'show',
    ]
)->middleware(
    'permission:medical_record.view'
);

/*
|--------------------------------------------------------------------------
| MEDICAL RECORD ADDENDUM
|--------------------------------------------------------------------------
*/

Route::post(
    '/medical-records/{medicalRecord}/revisions',
    [
        MedicalRecordController::class,
        'addRevision',
    ]
)->middleware(
    'permission:medical_record.update'
);

/*
|--------------------------------------------------------------------------
| MEDICINE SEARCH
|--------------------------------------------------------------------------
*/

Route::get(
    '/medicines/search',
    [
        MedicineController::class,
        'search',
    ]
)->middleware(
    'permission:prescription.view'
);

/*
|--------------------------------------------------------------------------
| MASTER MEDICINE
|--------------------------------------------------------------------------
*/

Route::get(
    '/master/medicines',
    [
        MedicineController::class,
        'index',
    ]
)->middleware(
    'permission:medicine.view'
);

Route::post(
    '/master/medicines',
    [
        MedicineController::class,
        'store',
    ]
)->middleware(
    'permission:medicine.create'
);

Route::get(
    '/master/medicines/{medicine}',
    [
        MedicineController::class,
        'show',
    ]
)->middleware(
    'permission:medicine.view'
);

Route::put(
    '/master/medicines/{medicine}',
    [
        MedicineController::class,
        'update',
    ]
)->middleware(
    'permission:medicine.update'
);

Route::patch(
    '/master/medicines/{medicine}/status',
    [
        MedicineController::class,
        'toggleStatus',
    ]
)->middleware(
    'permission:medicine.status'
);

Route::delete(
    '/master/medicines/{medicine}',
    [
        MedicineController::class,
        'destroy',
    ]
)->middleware(
    'permission:medicine.delete'
);

/*
|--------------------------------------------------------------------------
| PRESCRIPTION
|--------------------------------------------------------------------------
*/

Route::get(
    '/examinations/{examination}/prescription',
    [
        PrescriptionController::class,
        'showByExamination',
    ]
)->middleware(
    'permission:prescription.view'
);

Route::post(
    '/prescriptions',
    [
        PrescriptionController::class,
        'store',
    ]
)->middleware(
    'permission:prescription.create'
);

Route::put(
    '/prescriptions/{prescription}',
    [
        PrescriptionController::class,
        'update',
    ]
)->middleware(
    'permission:prescription.create'
);

Route::post(
    '/prescriptions/{prescription}/items',
    [
        PrescriptionController::class,
        'addItem',
    ]
)->middleware(
    'permission:prescription.create'
);

Route::delete(
    '/prescriptions/{prescription}/items/{item}',
    [
        PrescriptionController::class,
        'deleteItem',
    ]
)->middleware(
    'permission:prescription.create'
);

Route::patch(
    '/prescriptions/{prescription}/submit',
    [
        PrescriptionController::class,
        'submit',
    ]
)->middleware(
    'permission:prescription.create'
);

/*
|--------------------------------------------------------------------------
| PHARMACY PRESCRIPTION QUEUE
|--------------------------------------------------------------------------
*/

Route::get(
    '/pharmacy/prescriptions',
    [
        PrescriptionController::class,
        'index',
    ]
)->middleware(
    'permission:pharmacy.dispense'
);

Route::get(
    '/pharmacy/prescriptions/{prescription}',
    [
        PrescriptionController::class,
        'show',
    ]
)->middleware(
    'permission:pharmacy.dispense'
);

Route::patch(
    '/pharmacy/prescriptions/{prescription}/processing',
    [
        PrescriptionController::class,
        'startProcessing',
    ]
)->middleware(
    'permission:pharmacy.dispense'
);

Route::patch(
    '/pharmacy/prescriptions/{prescription}/ready',
    [
        PrescriptionController::class,
        'markReady',
    ]
)->middleware(
    'permission:pharmacy.dispense'
);

Route::patch(
    '/pharmacy/prescriptions/{prescription}/dispense',
    [
        PharmacyPrescriptionActionController::class,
        'dispense',
    ]
)->middleware(
    'permission:pharmacy.dispense'
);

/*
|--------------------------------------------------------------------------
| PHARMACY VERIFICATION
|--------------------------------------------------------------------------
*/

Route::patch(
    '/pharmacy/prescriptions/{prescription}/verify',
    [
        PharmacyPrescriptionActionController::class,
        'verify',
    ]
)->middleware(
    'permission:pharmacy.verify'
);

Route::patch(
    '/pharmacy/prescriptions/{prescription}/items/{item}/substitute',
    [
        PharmacyPrescriptionActionController::class,
        'substitute',
    ]
)->middleware(
    'permission:pharmacy.substitute'
);

Route::patch(
    '/pharmacy/prescriptions/{prescription}/cancel',
    [
        PharmacyPrescriptionActionController::class,
        'cancel',
    ]
)->middleware(
    'permission:pharmacy.cancel'
);

/*
|--------------------------------------------------------------------------
| PHARMACY INVENTORY
|--------------------------------------------------------------------------
*/

Route::get(
    '/pharmacy/stocks',
    [
        PharmacyInventoryController::class,
        'stocks',
    ]
)->middleware(
    'permission:stock.view'
);

Route::patch(
    '/pharmacy/stocks/{medicine}/minimum',
    [
        PharmacyInventoryController::class,
        'updateMinimumStock',
    ]
)->middleware(
    'permission:stock.manage'
);

Route::get(
    '/pharmacy/batches',
    [
        PharmacyInventoryController::class,
        'batches',
    ]
)->middleware(
    'permission:stock.view'
);

Route::post(
    '/pharmacy/batches',
    [
        PharmacyInventoryController::class,
        'storeBatch',
    ]
)->middleware(
    'permission:stock.manage'
);

Route::post(
    '/pharmacy/batches/{batch}/receive',
    [
        PharmacyInventoryController::class,
        'receiveBatch',
    ]
)->middleware(
    'permission:stock.manage'
);

Route::get(
    '/pharmacy/stock-movements',
    [
        PharmacyInventoryController::class,
        'movements',
    ]
)->middleware(
    'permission:stock.view'
);

Route::post(
    '/pharmacy/stock-opnames',
    [
        PharmacyInventoryController::class,
        'stockOpname',
    ]
)->middleware(
    'permission:stock.opname'
);

Route::get(
    '/pharmacy/suppliers',
    [
        PharmacyInventoryController::class,
        'suppliers',
    ]
)->middleware(
    'permission:stock.view'
);

Route::post(
    '/pharmacy/suppliers',
    [
        PharmacyInventoryController::class,
        'storeSupplier',
    ]
)->middleware(
    'permission:supplier.manage'
);

Route::put(
    '/pharmacy/suppliers/{supplier}',
    [
        PharmacyInventoryController::class,
        'updateSupplier',
    ]
)->middleware(
    'permission:supplier.manage'
);

Route::delete(
    '/pharmacy/suppliers/{supplier}',
    [
        PharmacyInventoryController::class,
        'destroySupplier',
    ]
)->middleware(
    'permission:supplier.manage'
);


/*
|--------------------------------------------------------------------------
| GENERAL INVENTORY
|--------------------------------------------------------------------------
|
| Inventaris umum dipisahkan dari stok obat Farmasi.
| Domain ini menangani ATK, housekeeping, IT, MFK, consumable alkes,
| spare part, kebutuhan event, dan barang operasional non-obat lainnya.
|
*/

Route::get(
    '/inventory/dashboard',
    [GeneralInventoryController::class, 'dashboard']
)->middleware('permission:inventory.view');

Route::get(
    '/inventory/options',
    [GeneralInventoryController::class, 'options']
)->middleware('permission:inventory.view');

Route::get(
    '/inventory/items',
    [GeneralInventoryController::class, 'items']
)->middleware('permission:inventory.view');

Route::post(
    '/inventory/items',
    [GeneralInventoryController::class, 'storeItem']
)->middleware('permission:inventory.manage');

Route::put(
    '/inventory/items/{inventoryItem}',
    [GeneralInventoryController::class, 'updateItem']
)->middleware('permission:inventory.manage');

Route::patch(
    '/inventory/items/{inventoryItem}/status',
    [GeneralInventoryController::class, 'toggleItemStatus']
)->middleware('permission:inventory.manage');

Route::get(
    '/inventory/categories',
    [GeneralInventoryController::class, 'categories']
)->middleware('permission:inventory.view');

Route::post(
    '/inventory/categories',
    [GeneralInventoryController::class, 'storeCategory']
)->middleware('permission:inventory.manage');

Route::put(
    '/inventory/categories/{inventoryCategory}',
    [GeneralInventoryController::class, 'updateCategory']
)->middleware('permission:inventory.manage');

Route::get(
    '/inventory/uoms',
    [GeneralInventoryController::class, 'uoms']
)->middleware('permission:inventory.view');

Route::post(
    '/inventory/uoms',
    [GeneralInventoryController::class, 'storeUom']
)->middleware('permission:inventory.manage');

Route::put(
    '/inventory/uoms/{inventoryUom}',
    [GeneralInventoryController::class, 'updateUom']
)->middleware('permission:inventory.manage');

Route::get(
    '/inventory/warehouses',
    [GeneralInventoryController::class, 'warehouses']
)->middleware('permission:inventory.view');

Route::post(
    '/inventory/warehouses',
    [GeneralInventoryController::class, 'storeWarehouse']
)->middleware('permission:inventory.manage');

Route::put(
    '/inventory/warehouses/{inventoryWarehouse}',
    [GeneralInventoryController::class, 'updateWarehouse']
)->middleware('permission:inventory.manage');

Route::get(
    '/inventory/stocks',
    [GeneralInventoryController::class, 'stocks']
)->middleware('permission:inventory.view');

Route::post(
    '/inventory/stock-in',
    [GeneralInventoryController::class, 'stockIn']
)->middleware('permission:inventory.stock_in');

Route::post(
    '/inventory/stock-out',
    [GeneralInventoryController::class, 'stockOut']
)->middleware('permission:inventory.stock_out');

Route::get(
    '/inventory/movements',
    [GeneralInventoryController::class, 'movements']
)->middleware('permission:inventory.view');

Route::get(
    '/inventory/requests',
    [GeneralInventoryController::class, 'requests']
)->middleware('permission:inventory.view');

Route::post(
    '/inventory/requests',
    [GeneralInventoryController::class, 'storeRequest']
)->middleware('permission:inventory.request');

Route::patch(
    '/inventory/requests/{inventoryRequest}/approve',
    [GeneralInventoryController::class, 'approveRequest']
)->middleware('permission:inventory.approve');

Route::patch(
    '/inventory/requests/{inventoryRequest}/reject',
    [GeneralInventoryController::class, 'rejectRequest']
)->middleware('permission:inventory.approve');

Route::post(
    '/inventory/requests/{inventoryRequest}/distribute',
    [GeneralInventoryController::class, 'distributeRequest']
)->middleware('permission:inventory.distribute');

Route::post(
    '/inventory/stock-opnames',
    [GeneralInventoryController::class, 'stockOpname']
)->middleware('permission:inventory.opname');


/*
|--------------------------------------------------------------------------
| ASSET & ALKES
|--------------------------------------------------------------------------
*/
Route::get('/assets/dashboard',[AssetController::class,'dashboard'])->middleware('permission:asset.view');
Route::get('/assets/options',[AssetController::class,'options'])->middleware('permission:asset.view');
Route::get('/assets/categories',[AssetController::class,'categories'])->middleware('permission:asset.view');
Route::post('/assets/categories',[AssetController::class,'storeCategory'])->middleware('permission:asset.manage');
Route::put('/assets/categories/{assetCategory}',[AssetController::class,'updateCategory'])->middleware('permission:asset.manage');
Route::get('/assets',[AssetController::class,'index'])->middleware('permission:asset.view');
Route::post('/assets',[AssetController::class,'store'])->middleware('permission:asset.manage');
Route::put('/assets/{asset}',[AssetController::class,'update'])->middleware('permission:asset.manage');
Route::patch('/assets/{asset}/status',[AssetController::class,'toggleStatus'])->middleware('permission:asset.manage');
Route::get('/assets-maintenances',[AssetController::class,'maintenances'])->middleware('permission:asset.view');
Route::post('/assets-maintenances',[AssetController::class,'storeMaintenance'])->middleware('permission:asset.maintenance');
Route::get('/asset-mutations',[AssetController::class,'mutations'])->middleware('permission:asset.view');
Route::post('/assets/{asset}/mutate',[AssetController::class,'mutate'])->middleware('permission:asset.transfer');

/*
|--------------------------------------------------------------------------
| PROCUREMENT / PENGADAAN
|--------------------------------------------------------------------------
*/
Route::get('/procurement/dashboard',[ProcurementController::class,'dashboard'])->middleware('permission:procurement.view');
Route::get('/procurement/options',[ProcurementController::class,'options'])->middleware('permission:procurement.view');
Route::get('/procurement/requests',[ProcurementController::class,'requests'])->middleware('permission:procurement.view');
Route::post('/procurement/requests',[ProcurementController::class,'storeRequest'])->middleware('permission:procurement.request');
Route::patch('/procurement/requests/{procurementRequest}/approve',[ProcurementController::class,'approve'])->middleware('permission:procurement.approve');
Route::patch('/procurement/requests/{procurementRequest}/reject',[ProcurementController::class,'reject'])->middleware('permission:procurement.approve');
Route::get('/procurement/quotations',[ProcurementController::class,'quotations'])->middleware('permission:procurement.view');
Route::post('/procurement/quotations',[ProcurementController::class,'storeQuotation'])->middleware('permission:procurement.manage');
Route::post('/procurement/quotations/{procurementQuotation}/select',[ProcurementController::class,'selectQuotation'])->middleware('permission:procurement.manage');
Route::get('/procurement/orders',[ProcurementController::class,'orders'])->middleware('permission:procurement.view');
Route::patch('/procurement/orders/{purchaseOrder}/issue',[ProcurementController::class,'issueOrder'])->middleware('permission:procurement.manage');
Route::post('/procurement/orders/{purchaseOrder}/receive',[ProcurementController::class,'receive'])->middleware('permission:procurement.receive');
Route::get('/procurement/receipts',[ProcurementController::class,'receipts'])->middleware('permission:procurement.view');


/*
|--------------------------------------------------------------------------
| LABORATORIUM
|--------------------------------------------------------------------------
*/

Route::get('/laboratory/dashboard', [LaboratoryController::class, 'dashboard'])
    ->middleware('permission:laboratory.view');
Route::get('/laboratory/options', [LaboratoryController::class, 'options'])
    ->middleware('permission:laboratory.view');

Route::get('/laboratory/sample-types', [LaboratoryController::class, 'sampleTypes'])
    ->middleware('permission:laboratory.view');
Route::post('/laboratory/sample-types', [LaboratoryController::class, 'storeSampleType'])
    ->middleware('permission:laboratory.master');
Route::put('/laboratory/sample-types/{laboratorySampleType}', [LaboratoryController::class, 'updateSampleType'])
    ->middleware('permission:laboratory.master');

Route::get('/laboratory/test-types', [LaboratoryController::class, 'testTypes'])
    ->middleware('permission:laboratory.view');
Route::post('/laboratory/test-types', [LaboratoryController::class, 'storeTestType'])
    ->middleware('permission:laboratory.master');
Route::put('/laboratory/test-types/{laboratoryTestType}', [LaboratoryController::class, 'updateTestType'])
    ->middleware('permission:laboratory.master');
Route::patch('/laboratory/test-types/{laboratoryTestType}/status', [LaboratoryController::class, 'toggleTestType'])
    ->middleware('permission:laboratory.master');

Route::get('/laboratory/test-types/{laboratoryTestType}/parameters', [LaboratoryController::class, 'parameters'])
    ->middleware('permission:laboratory.view');
Route::post('/laboratory/test-types/{laboratoryTestType}/parameters', [LaboratoryController::class, 'storeParameter'])
    ->middleware('permission:laboratory.master');
Route::put('/laboratory/parameters/{laboratoryParameter}', [LaboratoryController::class, 'updateParameter'])
    ->middleware('permission:laboratory.master');
Route::get('/laboratory/parameters/{laboratoryParameter}/reference-ranges', [LaboratoryController::class, 'referenceRanges'])
    ->middleware('permission:laboratory.view');
Route::post('/laboratory/parameters/{laboratoryParameter}/reference-ranges', [LaboratoryController::class, 'storeReferenceRange'])
    ->middleware('permission:laboratory.master');
Route::put('/laboratory/reference-ranges/{laboratoryReferenceRange}', [LaboratoryController::class, 'updateReferenceRange'])
    ->middleware('permission:laboratory.master');

Route::get('/laboratory/orders', [LaboratoryController::class, 'orders'])
    ->middleware('permission:laboratory.view');
Route::post('/laboratory/orders', [LaboratoryController::class, 'storeOrder'])
    ->middleware('permission:laboratory.create');
Route::get('/laboratory/orders/{laboratoryOrder}', [LaboratoryController::class, 'showOrder'])
    ->middleware('permission:laboratory.view');
Route::patch('/laboratory/orders/{laboratoryOrder}/submit', [LaboratoryController::class, 'submitOrder'])
    ->middleware('permission:laboratory.create');
Route::patch('/laboratory/orders/{laboratoryOrder}/cancel', [LaboratoryController::class, 'cancel'])
    ->middleware('permission:laboratory.cancel');

Route::post('/laboratory/orders/{laboratoryOrder}/collect-samples', [LaboratoryController::class, 'collectSamples'])
    ->middleware('permission:laboratory.collect_sample');
Route::post('/laboratory/orders/{laboratoryOrder}/receive-samples', [LaboratoryController::class, 'receiveSamples'])
    ->middleware('permission:laboratory.collect_sample');
Route::patch('/laboratory/specimens/{laboratorySpecimen}/reject', [LaboratoryController::class, 'rejectSpecimen'])
    ->middleware('permission:laboratory.collect_sample');

Route::post('/laboratory/orders/{laboratoryOrder}/start-processing', [LaboratoryController::class, 'startProcessing'])
    ->middleware('permission:laboratory.process');
Route::post('/laboratory/order-items/{laboratoryOrderItem}/results', [LaboratoryController::class, 'saveResults'])
    ->middleware('permission:laboratory.result');
Route::post('/laboratory/orders/{laboratoryOrder}/submit-verification', [LaboratoryController::class, 'submitForVerification'])
    ->middleware('permission:laboratory.result');
Route::post('/laboratory/orders/{laboratoryOrder}/verify', [LaboratoryController::class, 'verify'])
    ->middleware('permission:laboratory.verify');

/* BILLING LIST + SUMMARY */

Route::get(
    '/billing',
    [BillingController::class, 'index']
)->middleware('permission:billing.view');

Route::get(
    '/billing/summary',
    [BillingController::class, 'summary']
)->middleware('permission:billing.view');

Route::get(
    '/billing/candidates',
    [BillingController::class, 'candidates']
)->middleware('permission:billing.create');

Route::get(
    '/billing/transactions',
    [PaymentController::class, 'index']
)->middleware('permission:billing.view');

Route::get(
    '/billing/payment-methods',
    [BillingController::class, 'paymentMethods']
)->middleware('permission:billing.payment');

/* GENERATE */

Route::post(
    '/billing/generate/{visit}',
    [BillingController::class, 'generate']
)->middleware('permission:billing.create');

/* INVOICE DETAIL */

Route::get(
    '/billing/{invoice}',
    [BillingController::class, 'show']
)->middleware('permission:billing.view');

/* OTHER SERVICE CRUD */

Route::post(
    '/billing/{invoice}/items',
    [BillingController::class, 'addItem']
)->middleware('permission:billing.update');

Route::put(
    '/billing/{invoice}/items/{item}',
    [BillingController::class, 'updateItem']
)->middleware('permission:billing.update');

Route::delete(
    '/billing/{invoice}/items/{item}',
    [BillingController::class, 'deleteItem']
)->middleware('permission:billing.update');

/* PAYMENT */

Route::post(
    '/billing/{invoice}/payments',
    [PaymentController::class, 'store']
)->middleware('permission:billing.payment');

Route::patch(
    '/billing/{invoice}/payments/{payment}/void',
    [PaymentController::class, 'void']
)->middleware('permission:billing.payment');

/* CANCEL */

Route::patch(
    '/billing/{invoice}/cancel',
    [BillingController::class, 'cancel']
)->middleware('permission:billing.cancel');

/* MASTER TARIFF */

Route::get(
    '/master/tariffs/options',
    [TariffController::class, 'options']
)->middleware('permission:tariff.view');

Route::get(
    '/master/tariffs',
    [TariffController::class, 'index']
)->middleware('permission:tariff.view');

Route::post(
    '/master/tariffs',
    [TariffController::class, 'store']
)->middleware('permission:tariff.manage');

Route::put(
    '/master/tariffs/{tariff}',
    [TariffController::class, 'update']
)->middleware('permission:tariff.manage');

Route::patch(
    '/master/tariffs/{tariff}/status',
    [TariffController::class, 'toggleStatus']
)->middleware('permission:tariff.manage');

// MANAGEMENT REPORTS

Route::get(
    '/reports/overview',
    [ReportController::class, 'overview']
)->middleware('permission:report.view');

Route::get(
    '/reports/daily',
    [ReportController::class, 'daily']
)->middleware('permission:report.view');

Route::get(
    '/reports/monthly',
    [ReportController::class, 'monthly']
)->middleware('permission:report.view');

Route::get(
    '/reports/export',
    [ReportController::class, 'export']
)->middleware('permission:report.export');

/*
|--------------------------------------------------------------------------
| OPERATING ROOM / KAMAR OPERASI
|--------------------------------------------------------------------------
*/

Route::prefix('operating-room')->group(function () {

    Route::get(
        '/dashboard',
        [
            OperatingRoomController::class,
            'dashboard',
        ]
    )->middleware(
        'permission:operating_room.view'
    );

    Route::get(
        '/options',
        [
            OperatingRoomController::class,
            'options',
        ]
    )->middleware(
        'permission:operating_room.view'
    );

    Route::get(
    '/patients/search',
    [OperatingRoomController::class, 'searchPatients']
);

Route::get(
    '/patients/{patient}/visits',
    [OperatingRoomController::class, 'patientVisits']
);

    /*
    |--------------------------------------------------------------------------
    | MASTER JENIS OPERASI
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/operation-types',
        [
            OperatingRoomMasterController::class,
            'operationTypes',
        ]
    )->middleware(
        'permission:operating_room.master.manage'
    );

    Route::post(
        '/operation-types',
        [
            OperatingRoomMasterController::class,
            'storeOperationType',
        ]
    )->middleware(
        'permission:operating_room.master.manage'
    );

    Route::put(
        '/operation-types/{operationType}',
        [
            OperatingRoomMasterController::class,
            'updateOperationType',
        ]
    )->middleware(
        'permission:operating_room.master.manage'
    );

    /*
    |--------------------------------------------------------------------------
    | MASTER KAMAR OPERASI
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/rooms',
        [
            OperatingRoomMasterController::class,
            'rooms',
        ]
    )->middleware(
        'permission:operating_room.master.manage'
    );

    Route::post(
        '/rooms',
        [
            OperatingRoomMasterController::class,
            'storeRoom',
        ]
    )->middleware(
        'permission:operating_room.master.manage'
    );

    Route::put(
        '/rooms/{operatingRoom}',
        [
            OperatingRoomMasterController::class,
            'updateRoom',
        ]
    )->middleware(
        'permission:operating_room.master.manage'
    );

    /*
    |--------------------------------------------------------------------------
    | OPERASI
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/surgeries',
        [
            OperatingRoomController::class,
            'index',
        ]
    )->middleware(
        'permission:operating_room.view'
    );

    Route::post(
        '/surgeries',
        [
            OperatingRoomController::class,
            'store',
        ]
    )->middleware(
        'permission:operating_room.create'
    );

    Route::get(
        '/surgeries/{surgery}',
        [
            OperatingRoomController::class,
            'show',
        ]
    )->middleware(
        'permission:operating_room.view'
    );

    Route::put(
        '/surgeries/{surgery}',
        [
            OperatingRoomController::class,
            'update',
        ]
    )->middleware(
        'permission:operating_room.update'
    );

    /*
    |--------------------------------------------------------------------------
    | SCHEDULE
    |--------------------------------------------------------------------------
    */

    Route::patch(
        '/surgeries/{surgery}/schedule',
        [
            OperatingRoomController::class,
            'schedule',
        ]
    )->middleware(
        'permission:operating_room.schedule'
    );

    /*
    |--------------------------------------------------------------------------
    | TEAM OPERASI
    |--------------------------------------------------------------------------
    */

    Route::put(
        '/surgeries/{surgery}/team',
        [
            OperatingRoomController::class,
            'team',
        ]
    )->middleware(
        'permission:operating_room.team.manage'
    );

    /*
    |--------------------------------------------------------------------------
    | SAFETY CHECKLIST
    |--------------------------------------------------------------------------
    */

    Route::put(
        '/surgeries/{surgery}/checklist/{phase}',
        [
            OperatingRoomController::class,
            'checklist',
        ]
    )
        ->whereIn(
            'phase',
            [
                'preoperative',
                'sign-in',
                'time-out',
                'sign-out',
            ]
        )
        ->middleware(
            'permission:operating_room.checklist'
        );

    /*
    |--------------------------------------------------------------------------
    | OPERATING PROCESS
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/surgeries/{surgery}/start',
        [
            OperatingRoomController::class,
            'start',
        ]
    )->middleware(
        'permission:operating_room.start'
    );

    Route::post(
        '/surgeries/{surgery}/finish',
        [
            OperatingRoomController::class,
            'finish',
        ]
    )->middleware(
        'permission:operating_room.complete'
    );

    Route::post(
        '/surgeries/{surgery}/complete',
        [
            OperatingRoomController::class,
            'complete',
        ]
    )->middleware(
        'permission:operating_room.complete'
    );

    Route::post(
        '/surgeries/{surgery}/cancel',
        [
            OperatingRoomController::class,
            'cancel',
        ]
    )->middleware(
        'permission:operating_room.cancel'
    );

    /*
    |--------------------------------------------------------------------------
    | MEDICINE / MATERIAL / ASSET USAGE
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/surgeries/{surgery}/usages',
        [
            OperatingRoomController::class,
            'addUsage',
        ]
    )->middleware(
        'permission:operating_room.usage'
    );

    /*
    |--------------------------------------------------------------------------
    | RECOVERY
    |--------------------------------------------------------------------------
    */

    Route::put(
        '/surgeries/{surgery}/recovery',
        [
            OperatingRoomController::class,
            'recovery',
        ]
    )->middleware(
        'permission:operating_room.recovery'
    );

});

});
