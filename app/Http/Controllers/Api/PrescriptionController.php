<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Examination;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PrescriptionController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | PHARMACY PRESCRIPTION QUEUE
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $allowedStatuses = [
            'submitted',
            'processing',
            'ready',
            'dispensed',
        ];

        $query = Prescription::query()
            ->with([
                'patient',
                'doctor.employee',
                'visit.unit',
            ])
            ->withCount('items')
            ->whereIn('status', $allowedStatuses);

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = trim(
                $request->string('search')->toString()
            );

            $query->where(function ($query) use ($search) {
                $query
                    ->where(
                        'prescription_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'patient',
                        function ($patientQuery) use ($search) {
                            $patientQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'medical_record_number',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS FILTER
        |--------------------------------------------------------------------------
        */

        if ($request->filled('status')) {
            $status = $request
                ->string('status')
                ->toString();

            if (
                in_array(
                    $status,
                    $allowedStatuses,
                    true
                )
            ) {
                $query->where(
                    'status',
                    $status
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | DATE FILTER
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date')) {
            $query->whereDate(
                'submitted_at',
                $request
                    ->string('date')
                    ->toString()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | QUEUE ORDER
        |--------------------------------------------------------------------------
        */

        $prescriptions = $query
            ->orderByRaw("
                CASE status
                    WHEN 'submitted' THEN 1
                    WHEN 'processing' THEN 2
                    WHEN 'ready' THEN 3
                    WHEN 'dispensed' THEN 4
                    ELSE 5
                END
            ")
            ->orderBy(
                'submitted_at',
                'asc'
            )
            ->paginate(20)
            ->withQueryString();

        return response()->json(
            $prescriptions
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PHARMACY PRESCRIPTION DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
    Prescription $prescription
): JsonResponse {
    $prescription->load([
        'patient',
        'doctor.employee',
        'visit.unit',
        'examination',

        'items.medicine',
        'items.originalMedicine',

        'dispenseItems.batch',
    ]);

    return response()->json([
        'data' => $prescription,
    ]);
}

    /*
    |--------------------------------------------------------------------------
    | GET BY EXAMINATION
    |--------------------------------------------------------------------------
    */

    public function showByExamination(
        Examination $examination
    ): JsonResponse {
        $prescription = Prescription::query()
            ->where(
                'examination_id',
                $examination->id
            )
            ->with([
                'items.medicine',
                'doctor.employee',
            ])
            ->first();

        return response()->json([
            'data' => $prescription,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE DRAFT
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): JsonResponse {
        $data = $request->validate([
            'examination_id' => [
                'required',
                'integer',
                'exists:examinations,id',
            ],
        ]);

        $examination = Examination::with(
            'visit'
        )->findOrFail(
            $data['examination_id']
        );

        /*
        |--------------------------------------------------------------------------
        | COMPLETED EXAMINATION LOCK
        |--------------------------------------------------------------------------
        */

        if (
            $examination->status ===
            'completed'
        ) {
            return response()->json([
                'message' =>
                    'Pemeriksaan sudah selesai. Resep baru tidak dapat dibuat.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | RESOLVE DOCTOR
        |--------------------------------------------------------------------------
        */

        $doctor = $this->resolveDoctor(
            $request
        );

        if (
            (int) $examination->doctor_id !==
            (int) $doctor->id
        ) {
            return response()->json([
                'message' =>
                    'Pemeriksaan ini bukan milik dokter aktif.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | EXISTING PRESCRIPTION
        |--------------------------------------------------------------------------
        */

        $existing = Prescription::query()
            ->where(
                'examination_id',
                $examination->id
            )
            ->with(
                'items.medicine'
            )
            ->first();

        if ($existing) {
            return response()->json([
                'data' => $existing,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */

        $prescription = DB::transaction(
            function () use (
                $request,
                $examination,
                $doctor
            ) {
                return Prescription::create([
                    'prescription_number' =>
                        $this->generateNumber(),

                    'patient_id' =>
                        $examination
                            ->visit
                            ->patient_id,

                    'visit_id' =>
                        $examination
                            ->visit_id,

                    'examination_id' =>
                        $examination
                            ->id,

                    'doctor_id' =>
                        $doctor->id,

                    'status' =>
                        'draft',

                    'created_by' =>
                        $request
                            ->user()
                            ->id,

                    'updated_by' =>
                        $request
                            ->user()
                            ->id,
                ]);
            }
        );

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action: 'prescription.create',
            module: 'prescription',
            description:
                'Dokter membuat draft resep.',
            newValues: [
                'prescription_id' =>
                    $prescription->id,

                'examination_id' =>
                    $examination->id,
            ],
        );

        return response()->json([
            'message' =>
                'Draft resep berhasil dibuat.',

            'data' =>
                $prescription,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | ADD ITEM
    |--------------------------------------------------------------------------
    */

    public function addItem(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        $this->ensureDraft(
            $prescription
        );

        $this->ensureOwnership(
            $request,
            $prescription
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $data = $request->validate([
            'medicine_id' => [
                'required',
                'integer',
                'exists:medicines,id',
            ],

            'dosage' => [
                'nullable',
                'string',
                'max:255',
            ],

            'frequency' => [
                'nullable',
                'string',
                'max:255',
            ],

            'quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'unit' => [
                'nullable',
                'string',
                'max:100',
            ],

            'instruction' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | MEDICINE
        |--------------------------------------------------------------------------
        */

        $medicine = Medicine::query()
            ->where(
                'id',
                $data['medicine_id']
            )
            ->where(
                'is_active',
                true
            )
            ->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | DUPLICATE CHECK
        |--------------------------------------------------------------------------
        */

        $duplicate = $prescription
            ->items()
            ->where(
                'medicine_id',
                $medicine->id
            )
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'medicine_id' =>
                    'Obat sudah terdapat di resep.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE ITEM
        |--------------------------------------------------------------------------
        */

        $item = $prescription
            ->items()
            ->create([
                'medicine_id' =>
                    $medicine->id,

                'dosage' =>
                    $data['dosage']
                    ?? null,

                'frequency' =>
                    $data['frequency']
                    ?? null,

                'quantity' =>
                    $data['quantity'],

                'unit' =>
                    $data['unit']
                    ?? $medicine->unit,

                'instruction' =>
                    $data['instruction']
                    ?? null,
            ]);

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action:
                'prescription.item.create',
            module:
                'prescription',
            description:
                'Dokter menambahkan obat ke resep.',
            newValues: [
                'prescription_id' =>
                    $prescription->id,

                'medicine_id' =>
                    $medicine->id,
            ],
        );

        $item->load(
            'medicine'
        );

        return response()->json([
            'message' =>
                'Obat berhasil ditambahkan ke resep.',

            'data' =>
                $item,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE ITEM
    |--------------------------------------------------------------------------
    */

    public function deleteItem(
        Request $request,
        Prescription $prescription,
        int $item
    ): JsonResponse {
        $this->ensureDraft(
            $prescription
        );

        $this->ensureOwnership(
            $request,
            $prescription
        );

        /*
        |--------------------------------------------------------------------------
        | FIND ITEM
        |--------------------------------------------------------------------------
        */

        $prescriptionItem = $prescription
            ->items()
            ->where(
                'id',
                $item
            )
            ->firstOrFail();

        $oldValues = [
            'medicine_id' =>
                $prescriptionItem
                    ->medicine_id,

            'dosage' =>
                $prescriptionItem
                    ->dosage,

            'frequency' =>
                $prescriptionItem
                    ->frequency,

            'quantity' =>
                $prescriptionItem
                    ->quantity,
        ];

        /*
        |--------------------------------------------------------------------------
        | DELETE
        |--------------------------------------------------------------------------
        */

        $prescriptionItem->delete();

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action:
                'prescription.item.delete',
            module:
                'prescription',
            description:
                'Dokter menghapus obat dari draft resep.',
            oldValues:
                $oldValues,
        );

        return response()->json([
            'message' =>
                'Obat berhasil dihapus dari resep.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE DOCTOR NOTES
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        $this->ensureDraft(
            $prescription
        );

        $this->ensureOwnership(
            $request,
            $prescription
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $data = $request->validate([
            'doctor_notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | UPDATE
        |--------------------------------------------------------------------------
        */

        $prescription->update([
            'doctor_notes' =>
                $data['doctor_notes']
                ?? null,

            'updated_by' =>
                $request
                    ->user()
                    ->id,
        ]);

        return response()->json([
            'message' =>
                'Draft resep berhasil disimpan.',

            'data' =>
                $prescription->fresh([
                    'items.medicine',
                ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    public function submit(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        $this->ensureDraft(
            $prescription
        );

        $this->ensureOwnership(
            $request,
            $prescription
        );

        /*
        |--------------------------------------------------------------------------
        | ITEM REQUIRED
        |--------------------------------------------------------------------------
        */

        if (
            !$prescription
                ->items()
                ->exists()
        ) {
            return response()->json([
                'message' =>
                    'Resep belum memiliki obat.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | SUBMIT
        |--------------------------------------------------------------------------
        */

        $prescription->update([
            'status' =>
                'submitted',

            'submitted_at' =>
                now(),

            'updated_by' =>
                $request
                    ->user()
                    ->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action:
                'prescription.submit',
            module:
                'prescription',
            description:
                'Dokter mengirim resep ke farmasi.',
            newValues: [
                'prescription_id' =>
                    $prescription->id,

                'status' =>
                    'submitted',
            ],
        );

        return response()->json([
            'message' =>
                'Resep berhasil dikirim ke farmasi.',

            'data' =>
                $prescription->fresh([
                    'items.medicine',
                ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PHARMACY → PROCESSING
    |--------------------------------------------------------------------------
    */

    public function startProcessing(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | LOCK + TRANSACTION
        |--------------------------------------------------------------------------
        */

        return DB::transaction(
            function () use (
                $request,
                $prescription
            ) {
                $locked = Prescription::query()
                    ->whereKey(
                        $prescription->id
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                |--------------------------------------------------------------------------
                | STATUS MUST BE SUBMITTED
                |--------------------------------------------------------------------------
                */

                if (
                    $locked->status !==
                    'submitted'
                ) {
                    return response()->json([
                        'message' =>
                            'Hanya resep berstatus Submitted yang dapat diproses.',
                    ], 422);
                }

                /*
                |--------------------------------------------------------------------------
                | VERIFICATION REQUIRED
                |--------------------------------------------------------------------------
                */

                if (
                    !$locked->verified_at
                ) {
                    return response()->json([
                        'message' =>
                            'Resep harus diverifikasi terlebih dahulu sebelum diproses.',
                    ], 422);
                }

                /*
                |--------------------------------------------------------------------------
                | SUBMITTED → PROCESSING
                |--------------------------------------------------------------------------
                */

                $oldStatus =
                    $locked->status;

                $locked->update([
                    'status' =>
                        'processing',

                    'updated_by' =>
                        $request
                            ->user()
                            ->id,
                ]);

                /*
                |--------------------------------------------------------------------------
                | AUDIT
                |--------------------------------------------------------------------------
                */

                AuditLogger::log(
                    request: $request,
                    action:
                        'prescription.processing',
                    module:
                        'pharmacy',
                    description:
                        'Farmasi mulai memproses resep.',
                    oldValues: [
                        'status' =>
                            $oldStatus,
                    ],
                    newValues: [
                        'status' =>
                            'processing',
                    ],
                );

                return response()->json([
                    'message' =>
                        'Resep mulai diproses oleh farmasi.',

                    'data' =>
                        $locked->fresh([
                            'patient',
                            'doctor.employee',
                            'visit.unit',
                            'items.medicine',
                        ]),
                ]);
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PHARMACY → READY
    |--------------------------------------------------------------------------
    */

    public function markReady(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        return $this->transitionPharmacyStatus(
            request: $request,
            prescription: $prescription,
            expectedStatus: 'processing',
            nextStatus: 'ready',
            action: 'prescription.ready',
            description:
                'Farmasi menandai resep siap diserahkan.',
            message:
                'Resep telah siap diserahkan.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PHARMACY → DISPENSED
    |--------------------------------------------------------------------------
    */

    public function dispense(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        return DB::transaction(
            function () use (
                $request,
                $prescription
            ) {
                /*
                |--------------------------------------------------------------------------
                | LOCK
                |--------------------------------------------------------------------------
                */

                $locked = Prescription::query()
                    ->whereKey(
                        $prescription->id
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                |--------------------------------------------------------------------------
                | STATUS
                |--------------------------------------------------------------------------
                */

                if (
                    $locked->status !==
                    'ready'
                ) {
                    return response()->json([
                        'message' =>
                            'Hanya resep berstatus siap yang dapat diserahkan.',
                    ], 422);
                }

                $oldStatus =
                    $locked->status;

                /*
                |--------------------------------------------------------------------------
                | DISPENSE
                |--------------------------------------------------------------------------
                */

                $locked->update([
                    'status' =>
                        'dispensed',

                    'dispensed_at' =>
                        now(),

                    'updated_by' =>
                        $request
                            ->user()
                            ->id,
                ]);

                /*
                |--------------------------------------------------------------------------
                | AUDIT
                |--------------------------------------------------------------------------
                */

                AuditLogger::log(
                    request: $request,
                    action:
                        'prescription.dispensed',
                    module:
                        'pharmacy',
                    description:
                        'Farmasi menyerahkan obat kepada pasien.',
                    oldValues: [
                        'status' =>
                            $oldStatus,
                    ],
                    newValues: [
                        'status' =>
                            'dispensed',

                        'dispensed_at' =>
                            $locked
                                ->dispensed_at,
                    ],
                );

                return response()->json([
                    'message' =>
                        'Obat berhasil diserahkan kepada pasien.',

                    'data' =>
                        $locked->fresh([
                            'patient',
                            'doctor.employee',
                            'visit.unit',
                            'items.medicine',
                        ]),
                ]);
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PHARMACY STATUS TRANSITION
    |--------------------------------------------------------------------------
    */

    private function transitionPharmacyStatus(
        Request $request,
        Prescription $prescription,
        string $expectedStatus,
        string $nextStatus,
        string $action,
        string $description,
        string $message
    ): JsonResponse {
        return DB::transaction(
            function () use (
                $request,
                $prescription,
                $expectedStatus,
                $nextStatus,
                $action,
                $description,
                $message
            ) {
                /*
                |--------------------------------------------------------------------------
                | LOCK
                |--------------------------------------------------------------------------
                */

                $locked = Prescription::query()
                    ->whereKey(
                        $prescription->id
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                |--------------------------------------------------------------------------
                | STATUS VALIDATION
                |--------------------------------------------------------------------------
                */

                if (
                    $locked->status !==
                    $expectedStatus
                ) {
                    return response()->json([
                        'message' =>
                            'Status resep tidak valid untuk proses ini.',
                    ], 422);
                }

                $oldStatus =
                    $locked->status;

                /*
                |--------------------------------------------------------------------------
                | UPDATE
                |--------------------------------------------------------------------------
                */

                $locked->update([
                    'status' =>
                        $nextStatus,

                    'updated_by' =>
                        $request
                            ->user()
                            ->id,
                ]);

                /*
                |--------------------------------------------------------------------------
                | AUDIT
                |--------------------------------------------------------------------------
                */

                AuditLogger::log(
                    request: $request,
                    action:
                        $action,
                    module:
                        'pharmacy',
                    description:
                        $description,
                    oldValues: [
                        'status' =>
                            $oldStatus,
                    ],
                    newValues: [
                        'status' =>
                            $nextStatus,
                    ],
                );

                return response()->json([
                    'message' =>
                        $message,

                    'data' =>
                        $locked->fresh([
                            'patient',
                            'doctor.employee',
                            'visit.unit',
                            'items.medicine',
                        ]),
                ]);
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DOCTOR
    |--------------------------------------------------------------------------
    */

    private function resolveDoctor(
        Request $request
    ): Doctor {
        $doctor = Doctor::query()
            ->where(
                'employee_id',
                $request
                    ->user()
                    ->employee_id
            )
            ->where(
                'is_active',
                true
            )
            ->first();

        if (!$doctor) {
            abort(
                403,
                'Profil dokter aktif tidak ditemukan.'
            );
        }

        return $doctor;
    }

    /*
    |--------------------------------------------------------------------------
    | OWNERSHIP
    |--------------------------------------------------------------------------
    */

    private function ensureOwnership(
        Request $request,
        Prescription $prescription
    ): void {
        $doctor = $this->resolveDoctor(
            $request
        );

        if (
            (int) $prescription->doctor_id !==
            (int) $doctor->id
        ) {
            abort(
                403,
                'Resep ini bukan milik dokter aktif.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DRAFT ONLY
    |--------------------------------------------------------------------------
    */

    private function ensureDraft(
        Prescription $prescription
    ): void {
        if (
            $prescription->status !==
            'draft'
        ) {
            abort(
                422,
                'Resep yang sudah dikirim tidak dapat diedit.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | NUMBER
    |--------------------------------------------------------------------------
    */

    private function generateNumber(): string
    {
        $date =
            now()->format('Ymd');

        $prefix =
            "RX-{$date}-";

        $last = Prescription::query()
            ->where(
                'prescription_number',
                'like',
                "{$prefix}%"
            )
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();

        $next = 1;

        if (
            $last &&
            preg_match(
                '/(\d+)$/',
                $last->prescription_number,
                $matches
            )
        ) {
            $next =
                ((int) $matches[1])
                + 1;
        }

        return $prefix .
            str_pad(
                $next,
                4,
                '0',
                STR_PAD_LEFT
            );
    }
}