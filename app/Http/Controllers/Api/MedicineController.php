<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MedicineController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | MASTER MEDICINE LIST
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {
        $search =
            trim(
                (string) $request->query(
                    'search',
                    ''
                )
            );

        $status =
            $request->query(
                'status',
                'all'
            );

        $perPage =
            min(
                max(
                    (int) $request->query(
                        'per_page',
                        10
                    ),
                    5
                ),
                100
            );

        $query =
            Medicine::query();

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {
            $query->where(
                function ($subQuery) use (
                    $search
                ) {
                    $subQuery
                        ->where(
                            'code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'generic_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'manufacturer',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS FILTER
        |--------------------------------------------------------------------------
        */

        if (
            $status ===
            'active'
        ) {
            $query->where(
                'is_active',
                true
            );
        }

        if (
            $status ===
            'inactive'
        ) {
            $query->where(
                'is_active',
                false
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RESULT
        |--------------------------------------------------------------------------
        */

        $medicines =
            $query
                ->orderBy('name')
                ->paginate(
                    $perPage
                )
                ->withQueryString();

        return response()->json(
            $medicines
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        Medicine $medicine
    ): JsonResponse {
        return response()->json([
            'data' =>
                $medicine,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): JsonResponse {
        $data =
            $request->validate([
                'code' => [
                    'required',
                    'string',
                    'max:100',
                    'unique:medicines,code',
                ],

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'generic_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'dosage_form' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'strength' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'unit' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'manufacturer' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'is_active' => [
                    'sometimes',
                    'boolean',
                ],

                'manufacturer' => [
                    'nullable',
                    'string',
                'max:255',
                ],

                'halal_status' => [
    'required',
    'string',
    Rule::in(
        $this->halalStatuses()
    ),
],

'halal_certificate_number' => [
    'nullable',
    'string',
    'max:150',
],

'halal_valid_until' => [
    'nullable',
    'date',
],

'halal_notes' => [
    'nullable',
    'string',
    'max:2000',
],
            ]);

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE
        |--------------------------------------------------------------------------
        */

        $data['code'] =
            strtoupper(
                trim(
                    $data['code']
                )
            );

        $data['name'] =
            trim(
                $data['name']
            );

        $data['is_active'] =
            $data['is_active']
            ?? true;

        $data['halal_status'] =
    $data['halal_status']
    ?? 'unverified';

$data['halal_certificate_number'] =
    isset(
        $data['halal_certificate_number']
    )
        ? trim(
            $data[
                'halal_certificate_number'
            ]
        )
        : null;

$data['halal_notes'] =
    isset(
        $data['halal_notes']
    )
        ? trim(
            $data[
                'halal_notes'
            ]
        )
        : null;

        if (
    $data['halal_status'] !==
    'halal'
) {
    $data['halal_certificate_number'] =
        null;

    $data['halal_valid_until'] =
        null;
}

        $data['created_by'] =
            $request
                ->user()
                ->id;

        $data['updated_by'] =
            $request
                ->user()
                ->id;

        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */

        $medicine =
            Medicine::create(
                $data
            );

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,

            action:
                'medicine.create',

            module:
                'medicine',

            description:
                'Pengguna menambahkan master obat.',

            newValues: [
                'medicine_id' =>
                    $medicine->id,

                'code' =>
                    $medicine->code,

                'name' =>
                    $medicine->name,
            ],
        );

        return response()->json([
            'message' =>
                'Obat berhasil ditambahkan.',

            'data' =>
                $medicine,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        Medicine $medicine
    ): JsonResponse {
        $data =
            $request->validate([
                'code' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'medicines',
                        'code'
                    )->ignore(
                        $medicine->id
                    ),
                ],

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'generic_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'dosage_form' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'strength' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'unit' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'manufacturer' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'is_active' => [
                    'required',
                    'boolean',
                ],

                'manufacturer' => [
                    'nullable',
                    'string',
                'max:255',
                ],

                'halal_status' => [
    'required',
    'string',
    Rule::in(
        $this->halalStatuses()
    ),
],

'halal_certificate_number' => [
    'nullable',
    'string',
    'max:150',
],

'halal_valid_until' => [
    'nullable',
    'date',
],

'halal_notes' => [
    'nullable',
    'string',
    'max:2000',
],
            ]);

        $oldValues = [
            'code' =>
                $medicine->code,

            'name' =>
                $medicine->name,

            'generic_name' =>
                $medicine->generic_name,

            'dosage_form' =>
                $medicine->dosage_form,

            'strength' =>
                $medicine->strength,

            'unit' =>
                $medicine->unit,

            'manufacturer' =>
                $medicine->manufacturer,

            'halal_status' =>
    $medicine->halal_status,

'halal_certificate_number' =>
    $medicine->halal_certificate_number,

'halal_valid_until' =>
    $medicine->halal_valid_until,

'halal_notes' =>
    $medicine->halal_notes,

            'is_active' =>
                $medicine->is_active,
        ];

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE
        |--------------------------------------------------------------------------
        */

        $data['code'] =
            strtoupper(
                trim(
                    $data['code']
                )
            );

        $data['name'] =
            trim(
                $data['name']
            );

        $data['updated_by'] =
            $request
                ->user()
                ->id;

        /*
        |--------------------------------------------------------------------------
        | UPDATE
        |--------------------------------------------------------------------------
        */

        $medicine->update(
            $data
        );

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,

            action:
                'medicine.update',

            module:
                'medicine',

            description:
                'Pengguna mengubah master obat.',

            oldValues:
                $oldValues,

            newValues: [
                'medicine_id' =>
                    $medicine->id,

                'code' =>
                    $medicine->code,

                'name' =>
                    $medicine->name,

                'generic_name' =>
                    $medicine->generic_name,

                'dosage_form' =>
                    $medicine->dosage_form,

                'strength' =>
                    $medicine->strength,

                'unit' =>
                    $medicine->unit,

                'manufacturer' =>
                    $medicine->manufacturer,

                'halal_status' =>
                    $medicine->halal_status,

                'halal_certificate_number' =>
                    $medicine->halal_certificate_number,

                'halal_valid_until' =>
                    $medicine->halal_valid_until,

                'halal_notes' =>
                    $medicine->halal_notes,

                'is_active' =>
                    $medicine->is_active,
            ],
        );

        return response()->json([
            'message' =>
                'Obat berhasil diperbarui.',

            'data' =>
                $medicine->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(
        Request $request,
        Medicine $medicine
    ): JsonResponse {
        $oldStatus =
            $medicine
                ->is_active;

        $medicine->update([
            'is_active' =>
                !$medicine
                    ->is_active,

            'updated_by' =>
                $request
                    ->user()
                    ->id,
        ]);

        AuditLogger::log(
            request: $request,

            action:
                'medicine.status.update',

            module:
                'medicine',

            description:
                'Pengguna mengubah status master obat.',

            oldValues: [
                'is_active' =>
                    $oldStatus,
            ],

            newValues: [
                'medicine_id' =>
                    $medicine->id,
                
                'halal_status' =>
    $medicine->halal_status,

'halal_certificate_number' =>
    $medicine->halal_certificate_number,

'halal_valid_until' =>
    $medicine->halal_valid_until,

'halal_notes' =>
    $medicine->halal_notes,

                'is_active' =>
                    $medicine
                        ->is_active,
            ],
        );

        return response()->json([
            'message' =>
                $medicine
                    ->is_active
                    ? 'Obat berhasil diaktifkan.'
                    : 'Obat berhasil dinonaktifkan.',

            'data' =>
                $medicine->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        Request $request,
        Medicine $medicine
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | CHECK RELATION
        |--------------------------------------------------------------------------
        |
        | Kalau pernah dipakai di resep,
        | jangan hapus record historis.
        |
        */

        if (
            $medicine
                ->prescriptionItems()
                ->exists()
        ) {
            return response()->json([
                'message' =>
                    'Obat sudah digunakan pada resep dan tidak dapat dihapus. Nonaktifkan obat sebagai gantinya.',
            ], 422);
        }

        $oldValues = [
            'id' =>
                $medicine->id,

            'code' =>
                $medicine->code,

            'name' =>
                $medicine->name,
        ];

        $medicine->delete();

        AuditLogger::log(
            request: $request,

            action:
                'medicine.delete',

            module:
                'medicine',

            description:
                'Pengguna menghapus master obat.',

            oldValues:
                $oldValues,
        );

        return response()->json([
            'message' =>
                'Obat berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PRESCRIPTION MEDICINE SEARCH
    |--------------------------------------------------------------------------
    |
    | Endpoint ini dipakai dokter dari E-Resep.
    | Hanya obat aktif yang boleh muncul.
    |
    */

    public function search(
        Request $request
    ): JsonResponse {
        $search =
            trim(
                (string) $request->query(
                    'search',
                    ''
                )
            );

        $medicines =
            Medicine::query()
                ->where(
                    'is_active',
                    true
                )
                ->when(
                    $search !== '',
                    function (
                        $query
                    ) use (
                        $search
                    ) {
                        $query->where(
                            function (
                                $subQuery
                            ) use (
                                $search
                            ) {
                                $subQuery
                                    ->where(
                                        'code',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'generic_name',
                                        'like',
                                        "%{$search}%"
                                    );
                            }
                        );
                    }
                )
                ->orderBy('name')
                ->limit(20)
                ->get([
    'id',
    'code',
    'name',
    'generic_name',
    'dosage_form',
    'strength',
    'unit',
    'manufacturer',

    'halal_status',
    'halal_certificate_number',
    'halal_valid_until',
    'halal_notes',
                ]);

        return response()->json([
            'data' =>
                $medicines,
        ]);
    }

    private function halalStatuses(): array
{
    return [
        'halal',
        'non_halal',
        'unverified',
        'no_information',
    ];
}
}