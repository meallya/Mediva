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

});