<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Services\AuditLogger;
use App\Services\PharmacyStockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyPrescriptionActionController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | VERIFY
    |--------------------------------------------------------------------------
    */

    public function verify(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        if (
            $prescription->status !==
            'submitted'
        ) {
            return response()->json([
                'message' =>
                    'Hanya resep berstatus Submitted yang dapat diverifikasi.',
            ], 422);
        }

        $data =
            $request->validate([
                'verification_notes' => [
                    'nullable',
                    'string',
                    'max:5000',
                ],
            ]);

        if (
            !$prescription
                ->items()
                ->exists()
        ) {
            return response()->json([
                'message' =>
                    'Resep tidak memiliki item obat.',
            ], 422);
        }

        $prescription->update([
            'verified_at' =>
                now(),

            'verified_by' =>
                $request->user()->id,

            'verification_notes' =>
                $data['verification_notes']
                ?? null,

            'updated_by' =>
                $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'prescription.verify',
            module: 'pharmacy',
            description:
                'Farmasi melakukan verifikasi resep.',
            newValues: [
                'prescription_id' =>
                    $prescription->id,

                'verified_by' =>
                    $request->user()->id,
            ],
        );

        return response()->json([
            'message' =>
                'Resep berhasil diverifikasi.',

            'data' =>
                $prescription->fresh([
                    'items.medicine',
                    'verifiedBy',
                ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SUBSTITUTE MEDICINE
    |--------------------------------------------------------------------------
    */

    public function substitute(
        Request $request,
        Prescription $prescription,
        PrescriptionItem $item
    ): JsonResponse {
        if (
            $prescription->status !==
            'submitted'
        ) {
            return response()->json([
                'message' =>
                    'Substitusi hanya dapat dilakukan sebelum resep diproses.',
            ], 422);
        }

        if (
            (int) $item->prescription_id !==
            (int) $prescription->id
        ) {
            abort(
                404,
                'Item resep tidak ditemukan.'
            );
        }

        $data =
            $request->validate([
                'medicine_id' => [
                    'required',
                    'integer',
                    'exists:medicines,id',
                ],

                'reason' => [
                    'required',
                    'string',
                    'max:2000',
                ],
            ]);

        $medicine =
            Medicine::query()
                ->where(
                    'id',
                    $data['medicine_id']
                )
                ->where(
                    'is_active',
                    true
                )
                ->firstOrFail();

        if (
            (int) $medicine->id ===
            (int) $item->medicine_id
        ) {
            return response()->json([
                'message' =>
                    'Obat pengganti sama dengan obat sebelumnya.',
            ], 422);
        }

        $duplicate =
            $prescription
                ->items()
                ->where(
                    'id',
                    '!=',
                    $item->id
                )
                ->where(
                    'medicine_id',
                    $medicine->id
                )
                ->exists();

        if ($duplicate) {
            return response()->json([
                'message' =>
                    'Obat pengganti sudah terdapat di resep.',
            ], 422);
        }

        $oldMedicineId =
            $item->medicine_id;

        DB::transaction(
            function () use (
                $request,
                $prescription,
                $item,
                $medicine,
                $data
            ) {
                $item->update([
                    'original_medicine_id' =>
                        $item->original_medicine_id
                        ?? $item->medicine_id,

                    'medicine_id' =>
                        $medicine->id,

                    'unit' =>
                        $medicine->unit
                        ?? $item->unit,

                    'substitution_reason' =>
                        $data['reason'],

                    'substituted_by' =>
                        $request->user()->id,

                    'substituted_at' =>
                        now(),
                ]);

                /*
                 * Isi resep berubah.
                 * Kalau sebelumnya sudah diverifikasi,
                 * wajib verifikasi ulang.
                 */
                $prescription->update([
                    'verified_at' => null,
                    'verified_by' => null,
                    'verification_notes' => null,

                    'updated_by' =>
                        $request->user()->id,
                ]);
            }
        );

        AuditLogger::log(
            request: $request,
            action: 'prescription.substitute',
            module: 'pharmacy',
            description:
                'Farmasi melakukan substitusi obat pada resep.',
            oldValues: [
                'medicine_id' =>
                    $oldMedicineId,
            ],
            newValues: [
                'medicine_id' =>
                    $medicine->id,

                'reason' =>
                    $data['reason'],
            ],
        );

        return response()->json([
            'message' =>
                'Obat berhasil disubstitusi. Resep wajib diverifikasi kembali.',

            'data' =>
                $prescription->fresh([
                    'items.medicine',
                    'items.originalMedicine',
                ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    public function cancel(
        Request $request,
        Prescription $prescription
    ): JsonResponse {
        if (
            !in_array(
                $prescription->status,
                [
                    'submitted',
                    'processing',
                    'ready',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Resep pada status ini tidak dapat dibatalkan.',
            ], 422);
        }

        $data =
            $request->validate([
                'reason' => [
                    'required',
                    'string',
                    'max:2000',
                ],
            ]);

        $oldStatus =
            $prescription->status;

        $prescription->update([
            'status' =>
                'cancelled',

            'cancelled_at' =>
                now(),

            'cancellation_reason' =>
                $data['reason'],

            'updated_by' =>
                $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'prescription.cancel',
            module: 'pharmacy',
            description:
                'Farmasi membatalkan resep.',
            oldValues: [
                'status' =>
                    $oldStatus,
            ],
            newValues: [
                'status' =>
                    'cancelled',

                'reason' =>
                    $data['reason'],
            ],
        );

        return response()->json([
            'message' =>
                'Resep berhasil dibatalkan.',

            'data' =>
                $prescription->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DISPENSE + STOCK
    |--------------------------------------------------------------------------
    */

    public function dispense(
        Request $request,
        Prescription $prescription,
        PharmacyStockService $stockService
    ): JsonResponse {
        $allocations =
            $stockService->dispense(
                $prescription,
                $request->user()->id
            );

        AuditLogger::log(
            request: $request,
            action: 'prescription.dispense',
            module: 'pharmacy',
            description:
                'Farmasi menyerahkan obat dan mengurangi stok.',
            newValues: [
                'prescription_id' =>
                    $prescription->id,

                'status' =>
                    'dispensed',

                'allocations' =>
                    $allocations,
            ],
        );

        return response()->json([
            'message' =>
                'Obat berhasil diserahkan dan stok telah diperbarui.',

            'data' =>
                $prescription->fresh([
                    'items.medicine',
                    'dispenseItems.batch',
                ]),
        ]);
    }
}