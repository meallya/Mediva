<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\LaboratoryOrder;
use App\Models\LaboratoryOrderItem;
use App\Models\LaboratoryParameter;
use App\Models\LaboratoryReferenceRange;
use App\Models\LaboratoryResult;
use App\Models\LaboratorySampleType;
use App\Models\LaboratorySpecimen;
use App\Models\LaboratoryTestType;
use App\Models\Unit;
use App\Models\Visit;
use App\Services\AuditLogger;
use App\Services\LaboratoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LaboratoryController extends Controller
{
    public function __construct(
        private readonly LaboratoryService $laboratoryService,
    ) {
    }

    public function dashboard(): JsonResponse
    {
        $today = now()->toDateString();

        $summary = [
            'today_orders' => LaboratoryOrder::query()
                ->whereDate('created_at', $today)
                ->count(),
            'waiting_sample' => LaboratoryOrder::query()
                ->where('status', 'submitted')
                ->count(),
            'in_process' => LaboratoryOrder::query()
                ->whereIn('status', ['collected', 'in_process'])
                ->count(),
            'pending_verification' => LaboratoryOrder::query()
                ->where('status', 'pending_verification')
                ->count(),
            'completed_today' => LaboratoryOrder::query()
                ->where('status', 'completed')
                ->whereDate('verified_at', $today)
                ->count(),
            'critical_results' => LaboratoryResult::query()
                ->where('flag', 'critical')
                ->whereDate('created_at', $today)
                ->count(),
        ];

        $recent = LaboratoryOrder::query()
            ->with([
                'patient:id,medical_record_number,name',
                'doctor.employee:id,name',
                'requestingUnit:id,name,code',
            ])
            ->latest('id')
            ->limit(8)
            ->get();

        return response()->json([
            'data' => [
                'summary' => $summary,
                'recent_orders' => $recent,
            ],
        ]);
    }

    public function options(): JsonResponse
    {
        $testTypes = LaboratoryTestType::query()
            ->where('is_active', true)
            ->with([
                'sampleType:id,code,name,container',
                'parameters' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['referenceRanges' => fn ($query) => $query->where('is_active', true)]),
            ])
            ->orderBy('name')
            ->get();

        $visits = Visit::query()
            ->with([
                'patient:id,medical_record_number,name,gender,date_of_birth',
                'doctor.employee:id,name',
                'unit:id,name,code',
            ])
            ->where('status', '!=', 'cancelled')
            ->latest('id')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => [
                'sample_types' => LaboratorySampleType::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(),
                'test_types' => $testTypes,
                'visits' => $visits,
                'units' => Unit::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),
                'doctors' => Doctor::query()
                    ->with('employee:id,name')
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->get(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MASTER: JENIS SAMPEL
    |--------------------------------------------------------------------------
    */

    public function sampleTypes(): JsonResponse
    {
        return response()->json([
            'data' => LaboratorySampleType::query()
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeSampleType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:laboratory_sample_types,code'],
            'name' => ['required', 'string', 'max:120'],
            'container' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $row = LaboratorySampleType::create($validated);

        AuditLogger::log(
            request: $request,
            action: 'laboratory.sample_type.create',
            module: 'laboratory',
            description: 'Jenis sampel laboratorium dibuat.',
            newValues: $row->toArray(),
        );

        return response()->json([
            'message' => 'Jenis sampel berhasil ditambahkan.',
            'data' => $row,
        ], 201);
    }

    public function updateSampleType(
        Request $request,
        LaboratorySampleType $laboratorySampleType,
    ): JsonResponse {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('laboratory_sample_types', 'code')->ignore($laboratorySampleType->id),
            ],
            'name' => ['required', 'string', 'max:120'],
            'container' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $old = $laboratorySampleType->toArray();
        $laboratorySampleType->update($validated);

        AuditLogger::log(
            request: $request,
            action: 'laboratory.sample_type.update',
            module: 'laboratory',
            description: 'Jenis sampel laboratorium diubah.',
            oldValues: $old,
            newValues: $laboratorySampleType->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Jenis sampel berhasil diperbarui.',
            'data' => $laboratorySampleType->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MASTER: JENIS PEMERIKSAAN
    |--------------------------------------------------------------------------
    */

    public function testTypes(Request $request): JsonResponse
    {
        $query = LaboratoryTestType::query()
            ->with(['sampleType', 'parameters.referenceRanges'])
            ->latest('id');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($query) use ($search) {
                $query->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if (($status = $request->query('status')) && $status !== 'all') {
            $query->where('is_active', $status === 'active');
        }

        $perPage = max(5, min((int) $request->query('per_page', 20), 100));

        return response()->json($query->paginate($perPage));
    }

    public function storeTestType(Request $request): JsonResponse
    {
        $validated = $this->validateTestType($request);

        $row = LaboratoryTestType::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'laboratory.test_type.create',
            module: 'laboratory',
            description: 'Jenis pemeriksaan laboratorium dibuat.',
            newValues: $row->toArray(),
        );

        return response()->json([
            'message' => 'Jenis pemeriksaan berhasil ditambahkan.',
            'data' => $row->load(['sampleType', 'parameters.referenceRanges']),
        ], 201);
    }

    public function updateTestType(
        Request $request,
        LaboratoryTestType $laboratoryTestType,
    ): JsonResponse {
        $validated = $this->validateTestType($request, $laboratoryTestType->id);
        $old = $laboratoryTestType->toArray();

        $laboratoryTestType->update([
            ...$validated,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'laboratory.test_type.update',
            module: 'laboratory',
            description: 'Jenis pemeriksaan laboratorium diubah.',
            oldValues: $old,
            newValues: $laboratoryTestType->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Jenis pemeriksaan berhasil diperbarui.',
            'data' => $laboratoryTestType->fresh(['sampleType', 'parameters.referenceRanges']),
        ]);
    }

    public function toggleTestType(
        Request $request,
        LaboratoryTestType $laboratoryTestType,
    ): JsonResponse {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $laboratoryTestType->update([
            'is_active' => $validated['is_active'],
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Status pemeriksaan berhasil diperbarui.',
            'data' => $laboratoryTestType->fresh(),
        ]);
    }

    private function validateTestType(
        Request $request,
        ?int $ignoreId = null,
    ): array {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:40',
                Rule::unique('laboratory_test_types', 'code')->ignore($ignoreId),
            ],
            'name' => ['required', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:100'],
            'sample_type_id' => ['nullable', 'integer', 'exists:laboratory_sample_types,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'turnaround_minutes' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MASTER: PARAMETER & NILAI RUJUKAN
    |--------------------------------------------------------------------------
    */

    public function parameters(LaboratoryTestType $laboratoryTestType): JsonResponse
    {
        return response()->json([
            'data' => $laboratoryTestType->parameters()
                ->with('referenceRanges')
                ->get(),
        ]);
    }

    public function storeParameter(
        Request $request,
        LaboratoryTestType $laboratoryTestType,
    ): JsonResponse {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:40',
                Rule::unique('laboratory_parameters', 'code')
                    ->where('test_type_id', $laboratoryTestType->id),
            ],
            'name' => ['required', 'string', 'max:160'],
            'data_type' => ['required', Rule::in(['numeric', 'text'])],
            'unit' => ['nullable', 'string', 'max:40'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $row = $laboratoryTestType->parameters()->create($validated);

        AuditLogger::log(
            request: $request,
            action: 'laboratory.parameter.create',
            module: 'laboratory',
            description: 'Parameter pemeriksaan laboratorium dibuat.',
            newValues: $row->toArray(),
        );

        return response()->json([
            'message' => 'Parameter berhasil ditambahkan.',
            'data' => $row,
        ], 201);
    }

    public function updateParameter(
        Request $request,
        LaboratoryParameter $laboratoryParameter,
    ): JsonResponse {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:40',
                Rule::unique('laboratory_parameters', 'code')
                    ->where('test_type_id', $laboratoryParameter->test_type_id)
                    ->ignore($laboratoryParameter->id),
            ],
            'name' => ['required', 'string', 'max:160'],
            'data_type' => ['required', Rule::in(['numeric', 'text'])],
            'unit' => ['nullable', 'string', 'max:40'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $laboratoryParameter->update($validated);

        return response()->json([
            'message' => 'Parameter berhasil diperbarui.',
            'data' => $laboratoryParameter->fresh('referenceRanges'),
        ]);
    }

    public function referenceRanges(LaboratoryParameter $laboratoryParameter): JsonResponse
    {
        return response()->json([
            'data' => $laboratoryParameter->referenceRanges()
                ->orderBy('gender')
                ->orderBy('age_min_months')
                ->get(),
        ]);
    }

    public function storeReferenceRange(
        Request $request,
        LaboratoryParameter $laboratoryParameter,
    ): JsonResponse {
        $validated = $this->validateReferenceRange($request);
        $row = $laboratoryParameter->referenceRanges()->create($validated);

        return response()->json([
            'message' => 'Nilai rujukan berhasil ditambahkan.',
            'data' => $row,
        ], 201);
    }

    public function updateReferenceRange(
        Request $request,
        LaboratoryReferenceRange $laboratoryReferenceRange,
    ): JsonResponse {
        $validated = $this->validateReferenceRange($request);
        $laboratoryReferenceRange->update($validated);

        return response()->json([
            'message' => 'Nilai rujukan berhasil diperbarui.',
            'data' => $laboratoryReferenceRange->fresh(),
        ]);
    }

    private function validateReferenceRange(Request $request): array
    {
        return $request->validate([
            'gender' => ['required', Rule::in(['all', 'male', 'female'])],
            'age_min_months' => ['nullable', 'integer', 'min:0'],
            'age_max_months' => ['nullable', 'integer', 'min:0', 'gte:age_min_months'],
            'min_value' => ['nullable', 'numeric'],
            'max_value' => ['nullable', 'numeric', 'gte:min_value'],
            'reference_text' => ['nullable', 'string', 'max:255'],
            'critical_min' => ['nullable', 'numeric'],
            'critical_max' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PERMINTAAN PEMERIKSAAN
    |--------------------------------------------------------------------------
    */

    public function orders(Request $request): JsonResponse
    {
        $query = LaboratoryOrder::query()
            ->with([
                'patient:id,medical_record_number,name,gender,date_of_birth',
                'doctor.employee:id,name',
                'requestingUnit:id,name,code',
                'items.testType:id,code,name,price,sample_type_id',
                'specimens.sampleType:id,code,name,container',
            ])
            ->latest('id');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($query) use ($search) {
                $query->where('lab_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($patientQuery) use ($search) {
                        $patientQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('medical_record_number', 'like', "%{$search}%");
                    });
            });
        }

        if (($status = $request->query('status')) && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->query('date_to'));
        }

        $perPage = max(5, min((int) $request->query('per_page', 15), 100));

        return response()->json($query->paginate($perPage));
    }

    public function showOrder(LaboratoryOrder $laboratoryOrder): JsonResponse
    {
        return response()->json([
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    public function storeOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'visit_id' => ['required', 'integer', 'exists:visits,id'],
            'test_type_ids' => ['required', 'array', 'min:1'],
            'test_type_ids.*' => ['required', 'integer', 'distinct', 'exists:laboratory_test_types,id'],
            'clinical_notes' => ['nullable', 'string'],
            'is_draft' => ['sometimes', 'boolean'],
        ]);

        $visit = Visit::query()
            ->with(['patient', 'doctor', 'unit'])
            ->findOrFail($validated['visit_id']);

        if ($visit->status === 'cancelled') {
            throw ValidationException::withMessages([
                'visit_id' => 'Kunjungan yang dibatalkan tidak dapat dibuatkan permintaan laboratorium.',
            ]);
        }

        $testTypes = LaboratoryTestType::query()
            ->whereIn('id', $validated['test_type_ids'])
            ->where('is_active', true)
            ->get();

        if ($testTypes->count() !== count($validated['test_type_ids'])) {
            throw ValidationException::withMessages([
                'test_type_ids' => 'Terdapat jenis pemeriksaan yang tidak aktif.',
            ]);
        }

        $order = DB::transaction(function () use ($request, $validated, $visit, $testTypes) {
            $isDraft = (bool) ($validated['is_draft'] ?? false);

            $order = LaboratoryOrder::create([
                'lab_number' => $this->laboratoryService->newLabNumber(),
                'visit_id' => $visit->id,
                'patient_id' => $visit->patient_id,
                'doctor_id' => $visit->doctor_id,
                'requesting_unit_id' => $visit->unit_id,
                'status' => $isDraft ? 'draft' : 'submitted',
                'clinical_notes' => $validated['clinical_notes'] ?? null,
                'ordered_at' => $isDraft ? null : now(),
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);

            foreach ($testTypes as $testType) {
                $order->items()->create([
                    'test_type_id' => $testType->id,
                    'status' => 'pending',
                    'price' => $testType->price,
                ]);
            }

            return $order;
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.order.create',
            module: 'laboratory',
            description: 'Permintaan pemeriksaan laboratorium dibuat.',
            newValues: $order->toArray(),
        );

        return response()->json([
            'message' => $order->status === 'draft'
                ? 'Draf permintaan laboratorium berhasil disimpan.'
                : 'Permintaan laboratorium berhasil diajukan.',
            'data' => $this->loadOrder($order),
        ], 201);
    }

    public function submitOrder(
        Request $request,
        LaboratoryOrder $laboratoryOrder,
    ): JsonResponse {
        if ($laboratoryOrder->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => 'Hanya draf yang dapat diajukan.',
            ]);
        }

        $laboratoryOrder->update([
            'status' => 'submitted',
            'ordered_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'laboratory.order.submit',
            module: 'laboratory',
            description: 'Draf permintaan laboratorium diajukan.',
            newValues: ['laboratory_order_id' => $laboratoryOrder->id],
        );

        return response()->json([
            'message' => 'Permintaan laboratorium berhasil diajukan.',
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SAMPEL
    |--------------------------------------------------------------------------
    */

    public function collectSamples(
        Request $request,
        LaboratoryOrder $laboratoryOrder,
    ): JsonResponse {
        if ($laboratoryOrder->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => 'Sampel hanya dapat diambil dari permintaan yang sudah diajukan.',
            ]);
        }

        DB::transaction(function () use ($request, $laboratoryOrder) {
            $order = LaboratoryOrder::query()
                ->with('items.testType')
                ->lockForUpdate()
                ->findOrFail($laboratoryOrder->id);

            foreach ($order->items as $item) {
                if ($item->status === 'cancelled') {
                    continue;
                }

                LaboratorySpecimen::firstOrCreate(
                    ['laboratory_order_item_id' => $item->id],
                    [
                        'specimen_number' => $this->laboratoryService->newSpecimenNumber(),
                        'laboratory_order_id' => $order->id,
                        'sample_type_id' => $item->testType?->sample_type_id,
                        'status' => 'collected',
                        'collected_at' => now(),
                        'collected_by' => $request->user()->id,
                    ],
                );
            }

            $order->update([
                'status' => 'collected',
                'collected_at' => now(),
                'updated_by' => $request->user()->id,
            ]);
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.sample.collect',
            module: 'laboratory',
            description: 'Pengambilan sampel laboratorium dicatat.',
            newValues: ['laboratory_order_id' => $laboratoryOrder->id],
        );

        return response()->json([
            'message' => 'Pengambilan sampel berhasil dicatat.',
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    public function receiveSamples(
        Request $request,
        LaboratoryOrder $laboratoryOrder,
    ): JsonResponse {
        if ($laboratoryOrder->status !== 'collected') {
            throw ValidationException::withMessages([
                'status' => 'Sampel belum berada pada tahap pengambilan.',
            ]);
        }

        $specimens = $laboratoryOrder->specimens()
            ->where('status', 'collected')
            ->get();

        if ($specimens->isEmpty()) {
            throw ValidationException::withMessages([
                'specimen' => 'Tidak ada sampel yang dapat diterima.',
            ]);
        }

        foreach ($specimens as $specimen) {
            $specimen->update([
                'status' => 'received',
                'received_at' => now(),
                'received_by' => $request->user()->id,
            ]);
        }

        AuditLogger::log(
            request: $request,
            action: 'laboratory.sample.receive',
            module: 'laboratory',
            description: 'Sampel laboratorium diterima.',
            newValues: ['laboratory_order_id' => $laboratoryOrder->id],
        );

        return response()->json([
            'message' => 'Sampel berhasil diterima laboratorium.',
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    public function rejectSpecimen(
        Request $request,
        LaboratorySpecimen $laboratorySpecimen,
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if (!in_array($laboratorySpecimen->status, ['collected', 'received'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Sampel ini tidak dapat ditolak pada status sekarang.',
            ]);
        }

        DB::transaction(function () use ($request, $validated, $laboratorySpecimen) {
            $laboratorySpecimen->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejected_by' => $request->user()->id,
                'rejection_reason' => $validated['reason'],
            ]);

            $laboratorySpecimen->orderItem?->update([
                'status' => 'cancelled',
                'notes' => $validated['reason'],
            ]);

            $order = $laboratorySpecimen->order;
            $activeItemCount = $order->items()->where('status', '!=', 'cancelled')->count();

            if ($activeItemCount === 0) {
                $order->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => 'Seluruh sampel ditolak.',
                    'updated_by' => $request->user()->id,
                ]);
            }
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.sample.reject',
            module: 'laboratory',
            description: 'Sampel laboratorium ditolak.',
            newValues: [
                'laboratory_specimen_id' => $laboratorySpecimen->id,
                'reason' => $validated['reason'],
            ],
        );

        return response()->json([
            'message' => 'Sampel berhasil ditolak.',
            'data' => $laboratorySpecimen->fresh(['orderItem', 'sampleType']),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PROSES & HASIL
    |--------------------------------------------------------------------------
    */

    public function startProcessing(
        Request $request,
        LaboratoryOrder $laboratoryOrder,
    ): JsonResponse {
        if ($laboratoryOrder->status !== 'collected') {
            throw ValidationException::withMessages([
                'status' => 'Pemeriksaan hanya dapat dimulai setelah sampel diambil dan diterima.',
            ]);
        }

        $activeItems = $laboratoryOrder->items()->where('status', '!=', 'cancelled')->get();

        if ($activeItems->isEmpty()) {
            throw ValidationException::withMessages([
                'item' => 'Tidak ada pemeriksaan aktif untuk diproses.',
            ]);
        }

        $unreceived = $laboratoryOrder->specimens()
            ->whereIn('laboratory_order_item_id', $activeItems->pluck('id'))
            ->where('status', '!=', 'received')
            ->exists();

        if ($unreceived) {
            throw ValidationException::withMessages([
                'specimen' => 'Semua sampel aktif harus diterima sebelum pemeriksaan dimulai.',
            ]);
        }

        DB::transaction(function () use ($request, $laboratoryOrder) {
            $laboratoryOrder->items()
                ->where('status', 'pending')
                ->update(['status' => 'in_process']);

            $laboratoryOrder->update([
                'status' => 'in_process',
                'processing_started_at' => now(),
                'updated_by' => $request->user()->id,
            ]);
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.process.start',
            module: 'laboratory',
            description: 'Proses pemeriksaan laboratorium dimulai.',
            newValues: ['laboratory_order_id' => $laboratoryOrder->id],
        );

        return response()->json([
            'message' => 'Pemeriksaan laboratorium mulai diproses.',
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    public function saveResults(
        Request $request,
        LaboratoryOrderItem $laboratoryOrderItem,
    ): JsonResponse {
        $order = $laboratoryOrderItem->order()->with('patient')->firstOrFail();

        if ($order->status !== 'in_process' || $laboratoryOrderItem->status === 'cancelled') {
            throw ValidationException::withMessages([
                'status' => 'Hasil hanya dapat diinput saat pemeriksaan sedang diproses.',
            ]);
        }

        $validated = $request->validate([
            'results' => ['required', 'array', 'min:1'],
            'results.*.parameter_id' => ['required', 'integer', 'distinct', 'exists:laboratory_parameters,id'],
            'results.*.value' => ['nullable', 'string', 'max:255'],
            'results.*.flag' => ['nullable', Rule::in(['normal', 'low', 'high', 'critical', 'abnormal'])],
            'results.*.notes' => ['nullable', 'string'],
        ]);

        $parameters = LaboratoryParameter::query()
            ->where('test_type_id', $laboratoryOrderItem->test_type_id)
            ->whereIn('id', collect($validated['results'])->pluck('parameter_id'))
            ->where('is_active', true)
            ->with('referenceRanges')
            ->get()
            ->keyBy('id');

        if ($parameters->count() !== count($validated['results'])) {
            throw ValidationException::withMessages([
                'results' => 'Terdapat parameter yang tidak sesuai dengan jenis pemeriksaan.',
            ]);
        }

        DB::transaction(function () use ($request, $validated, $laboratoryOrderItem, $order, $parameters) {
            foreach ($validated['results'] as $input) {
                /** @var LaboratoryParameter $parameter */
                $parameter = $parameters->get($input['parameter_id']);
                $value = isset($input['value']) ? trim((string) $input['value']) : null;

                $numericValue = null;
                if ($parameter->data_type === 'numeric' && $value !== null && $value !== '') {
                    if (!is_numeric($value)) {
                        throw ValidationException::withMessages([
                            'results' => "Nilai {$parameter->name} harus berupa angka.",
                        ]);
                    }
                    $numericValue = (float) $value;
                }

                $range = $this->laboratoryService->resolveReferenceRange(
                    $parameter,
                    $order->patient,
                    $order->ordered_at ?? $order->created_at,
                );

                $flag = $this->laboratoryService->determineFlag(
                    $numericValue,
                    $range,
                    $parameter->data_type,
                    $input['flag'] ?? null,
                );

                LaboratoryResult::updateOrCreate(
                    [
                        'laboratory_order_item_id' => $laboratoryOrderItem->id,
                        'parameter_id' => $parameter->id,
                    ],
                    [
                        'value' => $value,
                        'numeric_value' => $numericValue,
                        'unit' => $parameter->unit,
                        'reference_low' => $range?->min_value,
                        'reference_high' => $range?->max_value,
                        'reference_text' => $range?->reference_text,
                        'flag' => $flag,
                        'notes' => $input['notes'] ?? null,
                        'entered_by' => $request->user()->id,
                        'entered_at' => now(),
                        'verified_by' => null,
                        'verified_at' => null,
                    ],
                );
            }
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.result.save',
            module: 'laboratory',
            description: 'Hasil laboratorium diinput atau diperbarui.',
            newValues: [
                'laboratory_order_item_id' => $laboratoryOrderItem->id,
                'result_count' => count($validated['results']),
            ],
        );

        return response()->json([
            'message' => 'Hasil pemeriksaan berhasil disimpan.',
            'data' => $laboratoryOrderItem->fresh([
                'testType.parameters.referenceRanges',
                'results.parameter',
            ]),
        ]);
    }

    public function submitForVerification(
        Request $request,
        LaboratoryOrder $laboratoryOrder,
    ): JsonResponse {
        if ($laboratoryOrder->status !== 'in_process') {
            throw ValidationException::withMessages([
                'status' => 'Hanya pemeriksaan yang sedang diproses yang dapat diajukan untuk verifikasi.',
            ]);
        }

        $items = $laboratoryOrder->items()
            ->where('status', '!=', 'cancelled')
            ->with(['testType.parameters' => fn ($query) => $query->where('is_active', true), 'results'])
            ->get();

        foreach ($items as $item) {
            $expectedParameterIds = $item->testType->parameters->pluck('id')->sort()->values();
            $resultParameterIds = $item->results
                ->filter(fn ($result) => $result->value !== null && $result->value !== '')
                ->pluck('parameter_id')
                ->sort()
                ->values();

            if ($expectedParameterIds->isEmpty() || $expectedParameterIds->all() !== $resultParameterIds->all()) {
                throw ValidationException::withMessages([
                    'results' => "Hasil {$item->testType->name} belum lengkap.",
                ]);
            }
        }

        DB::transaction(function () use ($request, $laboratoryOrder) {
            $laboratoryOrder->items()
                ->where('status', '!=', 'cancelled')
                ->update(['status' => 'pending_verification']);

            $laboratoryOrder->update([
                'status' => 'pending_verification',
                'submitted_for_verification_at' => now(),
                'updated_by' => $request->user()->id,
            ]);
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.result.submit_verification',
            module: 'laboratory',
            description: 'Hasil laboratorium diajukan untuk verifikasi.',
            newValues: ['laboratory_order_id' => $laboratoryOrder->id],
        );

        return response()->json([
            'message' => 'Hasil berhasil diajukan untuk verifikasi.',
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    public function verify(
        Request $request,
        LaboratoryOrder $laboratoryOrder,
    ): JsonResponse {
        if ($laboratoryOrder->status !== 'pending_verification') {
            throw ValidationException::withMessages([
                'status' => 'Hasil belum berada pada tahap verifikasi.',
            ]);
        }

        DB::transaction(function () use ($request, $laboratoryOrder) {
            $itemIds = $laboratoryOrder->items()
                ->where('status', '!=', 'cancelled')
                ->pluck('id');

            LaboratoryResult::query()
                ->whereIn('laboratory_order_item_id', $itemIds)
                ->update([
                    'verified_by' => $request->user()->id,
                    'verified_at' => now(),
                ]);

            $laboratoryOrder->items()
                ->where('status', 'pending_verification')
                ->update(['status' => 'completed']);

            $laboratoryOrder->update([
                'status' => 'completed',
                'verified_at' => now(),
                'verified_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.result.verify',
            module: 'laboratory',
            description: 'Hasil laboratorium diverifikasi.',
            newValues: [
                'laboratory_order_id' => $laboratoryOrder->id,
                'lab_number' => $laboratoryOrder->lab_number,
            ],
        );

        return response()->json([
            'message' => 'Hasil laboratorium berhasil diverifikasi.',
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    public function cancel(
        Request $request,
        LaboratoryOrder $laboratoryOrder,
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if (in_array($laboratoryOrder->status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Permintaan yang sudah selesai atau dibatalkan tidak dapat dibatalkan kembali.',
            ]);
        }

        DB::transaction(function () use ($request, $validated, $laboratoryOrder) {
            $laboratoryOrder->items()->update(['status' => 'cancelled']);
            $laboratoryOrder->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $validated['reason'],
                'updated_by' => $request->user()->id,
            ]);
        });

        AuditLogger::log(
            request: $request,
            action: 'laboratory.order.cancel',
            module: 'laboratory',
            description: 'Permintaan laboratorium dibatalkan.',
            newValues: [
                'laboratory_order_id' => $laboratoryOrder->id,
                'reason' => $validated['reason'],
            ],
        );

        return response()->json([
            'message' => 'Permintaan laboratorium berhasil dibatalkan.',
            'data' => $this->loadOrder($laboratoryOrder),
        ]);
    }

    private function loadOrder(LaboratoryOrder $laboratoryOrder): LaboratoryOrder
    {
        return $laboratoryOrder->fresh([
            'visit:id,visit_number,status',
            'patient:id,medical_record_number,name,gender,date_of_birth',
            'doctor.employee:id,name',
            'requestingUnit:id,name,code',
            'items.testType.sampleType',
            'items.testType.parameters.referenceRanges',
            'items.results.parameter',
            'specimens.sampleType',
            'specimens.orderItem.testType:id,code,name',
            'creator:id,name',
            'verifier:id,name',
        ]);
    }
}
