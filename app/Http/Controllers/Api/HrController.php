<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{
    Employee,
    HrAbsenceRequest,
    HrAttendance,
    HrEmployeeContract,
    HrEmployeeCredential,
    HrEmployeeEmployment,
    HrEmployeeOffboarding,
    HrEmployeeSchedule,
    HrEmployeeUnitAssignment,
    HrOvertimeRequest,
    HrPerformanceReview,
    HrTraining,
    RoleAssignment,
    Unit
};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class HrController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $today = now()->toDateString();
        $warning = now()->addDays(90)->toDateString();

        return response()->json([
            'data' => [
                'total_employees'    => Employee::count(),
                'active_employees'   => Employee::where('is_active', true)->count(),
                'inactive_employees' => Employee::where('is_active', false)->count(),

                'attendance_today'   => HrAttendance::whereDate('attendance_date', $today)
                                            ->whereIn('status', ['present', 'late'])->count(),
                'absent_today'       => HrAttendance::whereDate('attendance_date', $today)
                                            ->where('status', 'absent')->count(),
                'on_leave_today'     => HrAbsenceRequest::where('status', 'approved')
                                            ->whereDate('start_date', '<=', $today)
                                            ->whereDate('end_date', '>=', $today)->count(),

                'contracts_expiring' => HrEmployeeContract::whereBetween('end_date', [$today, $warning])->count(),
                'str_expiring'       => HrEmployeeCredential::where('credential_type', 'STR')
                                            ->whereBetween('valid_until', [$today, $warning])->count(),
                'sip_expiring'       => HrEmployeeCredential::where('credential_type', 'SIP')
                                            ->whereBetween('valid_until', [$today, $warning])->count(),

                'today_schedules'    => HrEmployeeSchedule::with(['employee:id,employee_number,name'])
                                            ->whereDate('schedule_date', $today)
                                            ->limit(20)
                                            ->get(),
            ]
        ]);
    }

    public function employees(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->value();

        $employees = Employee::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($x) use ($search) {
                    $x->where('employee_number', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhere('nik', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        return response()->json($employees);
    }

    public function employee(Employee $employee): JsonResponse
    {
        $relations = [
            'user', 'employment', 'unitAssignments', 'positionHistories',
            'educations', 'certifications', 'credentials', 'contracts',
            'schedules', 'attendances', 'leaveBalances', 'absenceRequests',
            'overtimeRequests', 'performanceReviews', 'disciplinaryActions',
            'trainings', 'documents', 'offboarding', 'directSupervisor'
        ];

        return response()->json([
            'data' => $employee->load($relations)
        ]);
    }

    public function storeEmployee(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_number'         => ['nullable', 'string', 'max:100'],
            'nik'                     => ['nullable', 'string', 'max:32'],
            'name'                    => ['required', 'string', 'max:255'],
            'email'                   => ['nullable', 'email'],
            'phone'                   => ['nullable', 'string', 'max:50'],
            'birth_place'             => ['nullable', 'string'],
            'date_of_birth'           => ['nullable', 'date'],
            'gender'                  => ['nullable', 'in:male,female'],
            'address'                 => ['nullable', 'string'],
            'marital_status'          => ['nullable', 'string'],
            'emergency_contact_name'  => ['nullable', 'string'],
            'emergency_contact_phone' => ['nullable', 'string'],
            'join_date'               => ['nullable', 'date'],
            'is_active'               => ['sometimes', 'boolean'],
            'unit_ids'                => ['nullable', 'array'],
            'unit_ids.*'              => ['integer', 'exists:units,id'],
            'employment'              => ['nullable', 'array']
        ]);

        $employee = DB::transaction(function () use ($request, $data) {
            $employment = $data['employment'] ?? null;
            $units = $data['unit_ids'] ?? [];

            unset($data['employment'], $data['unit_ids']);

            $data['employee_number'] = $data['employee_number'] ?: ('EMP-' . str_pad((string)(((int)Employee::max('id')) + 1), 5, '0', STR_PAD_LEFT));
            $data['updated_by'] = $request->user()->id;

            $e = Employee::create($data);

            if ($employment) {
                $e->employment()->create($employment);
            }

            foreach ($units as $index => $unitId) {
                $e->unitAssignments()->create([
                    'unit_id'    => $unitId,
                    'is_primary' => $index === 0,
                    'start_date' => $e->join_date,
                    'is_active'  => true
                ]);
            }

            return $e;
        });

        return response()->json([
            'message' => 'Pegawai berhasil ditambahkan.',
            'data'    => $employee
        ], 201);
    }

    public function schedules(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->value();
        $scheduleType = $request->query('schedule_type');

        $query = HrEmployeeSchedule::query()
            ->with('employee:id,employee_number,name')
            ->when($search !== '', function ($q) use ($search) {
                return $q->whereHas('employee', function ($subQ) use ($search) {
                    $subQ->where('employee_number', 'like', "%{$search}%")
                         ->orWhere('name', 'like', "%{$search}%");
                })->orWhere('schedule_date', 'like', "%{$search}%");
            })
            ->when($scheduleType && $scheduleType !== 'all', function ($q) use ($scheduleType) {
                return $q->where('schedule_type', $scheduleType);
            })
            ->orderByDesc('schedule_date');

        return response()->json($query->paginate(50));
    }

    public function storeSchedule(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id'   => ['required', 'integer', 'exists:employees,id'],
            'schedule_date' => ['required', 'date'],
            'schedule_type' => ['required', 'in:regular,shift,oncall'],
            'shift_id'      => ['nullable', 'integer'],
            'unit_id'       => ['nullable', 'integer', 'exists:units,id'],
            'notes'         => ['nullable', 'string', 'max:500'],
        ]);

        $schedule = HrEmployeeSchedule::create($data);

        return response()->json([
            'message' => 'Jadwal & Shift berhasil ditambahkan.',
            'data'    => $schedule->load('employee:id,employee_number,name'),
        ], 201);
    }

    public function updateSchedule(Request $request, HrEmployeeSchedule $schedule): JsonResponse
    {
        $data = $request->validate([
            'employee_id'   => ['sometimes', 'integer', 'exists:employees,id'],
            'schedule_date' => ['sometimes', 'date'],
            'schedule_type' => ['sometimes', 'in:regular,shift,oncall'],
            'shift_id'      => ['nullable', 'integer'],
            'unit_id'       => ['nullable', 'integer', 'exists:units,id'],
            'notes'         => ['nullable', 'string', 'max:500'],
        ]);

        $schedule->update($data);

        return response()->json([
            'message' => 'Jadwal & Shift berhasil diperbarui.',
            'data'    => $schedule->load('employee:id,employee_number,name'),
        ]);
    }

    public function deleteSchedule(Request $request, HrEmployeeSchedule $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json([
            'message' => 'Jadwal & Shift berhasil dihapus.',
        ]);
    }

    public function attendances(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->value();
        $status = $request->query('status');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $attendances = HrAttendance::query()
            ->with('employee:id,employee_number,name')
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('employee', function ($q) use ($search) {
                    $q->where('employee_number', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($dateFrom, fn ($q) => $q->whereDate('attendance_date', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('attendance_date', '<=', $dateTo))
            ->orderByDesc('attendance_date')
            ->orderByDesc('id')
            ->paginate(50);

        return response()->json($attendances);
    }

    public function createAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate($this->attendanceRules());

        if (!empty($validated['clock_in_at'])) {
            $validated['clock_in_at'] = $validated['attendance_date'] . ' ' . $validated['clock_in_at'] . ':00';
        }
        if (!empty($validated['clock_out_at'])) {
            $validated['clock_out_at'] = $validated['attendance_date'] . ' ' . $validated['clock_out_at'] . ':00';
        }

        $attendance = HrAttendance::create($validated);
        $this->syncToHrisSafely('push', $attendance);

        return response()->json([
            'message' => 'Kehadiran berhasil ditambahkan.',
            'data'    => $attendance->load('employee:id,employee_number,name'),
        ], 201);
    }

    public function updateAttendance(Request $request, HrAttendance $attendance): JsonResponse
    {
        $validated = $request->validate($this->attendanceRules(isUpdate: true));

        $date = $validated['attendance_date'] ?? $attendance->attendance_date;

        if (!empty($validated['clock_in_at'])) {
            $time = strlen($validated['clock_in_at']) <= 5 ? $validated['clock_in_at'] . ':00' : $validated['clock_in_at'];
            $validated['clock_in_at'] = $date . ' ' . $time;
        }

        if (!empty($validated['clock_out_at'])) {
            $time = strlen($validated['clock_out_at']) <= 5 ? $validated['clock_out_at'] . ':00' : $validated['clock_out_at'];
            $validated['clock_out_at'] = $date . ' ' . $time;
        }

        $attendance->update($validated);
        $this->syncToHrisSafely('update', $attendance);

        return response()->json([
            'message' => 'Kehadiran berhasil diperbarui.',
            'data'    => $attendance->load('employee:id,employee_number,name'),
        ]);
    }

    public function deleteAttendance(HrAttendance $attendance): JsonResponse
    {
        $attendanceId = $attendance->id;
        $attendance->delete();
        $this->syncToHrisSafely('delete', $attendanceId);

        return response()->json([
            'message' => 'Kehadiran berhasil dihapus.',
        ]);
    }

    public function syncAttendancesFromHris(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to'   => ['required', 'date', 'after_or_equal:date_from'],
        ]);

        try {
            $hrisData = [];
            $syncedCount = 0;

            foreach ($hrisData as $record) {
                HrAttendance::updateOrCreate(
                    [
                        'employee_id'     => $record['employee_id'],
                        'attendance_date' => $record['attendance_date'],
                    ],
                    [
                        'status'              => $record['status'],
                        'check_in'            => $record['check_in'],
                        'check_out'           => $record['check_out'],
                        'is_synced_from_hris' => true,
                    ]
                );
                $syncedCount++;
            }

            return response()->json([
                'message' => "Berhasil sync {$syncedCount} data kehadiran dari HRIS.",
            ]);
        } catch (\Throwable $e) {
            Log::error("Gagal sync kehadiran dari HRIS: {$e->getMessage()}");
            return response()->json(['message' => "Gagal sync dari HRIS: {$e->getMessage()}"], 500);
        }
    }

    private function attendanceRules(bool $isUpdate = false): array
    {
        $presence = $isUpdate ? 'sometimes' : 'required';
        return [
            'employee_id'         => [$presence, 'integer', 'exists:employees,id'],
            'schedule_id'         => ['nullable', 'integer', 'exists:hr_employee_schedules,id'],
            'attendance_date'     => [$presence, 'date'],
            'status'              => [$presence, Rule::in(['present', 'late', 'absent', 'sick', 'leave'])],

            'clock_in_at'         => ['nullable'],
            'clock_out_at'        => ['nullable'],

            'late_minutes'        => ['nullable', 'integer', 'min:0'],
            'early_leave_minutes' => ['nullable', 'integer', 'min:0'],
            'notes'               => ['nullable', 'string', 'max:500'],
        ];
    }

    private function syncToHrisSafely(string $action, mixed $payload): void
    {
    }

    public function absences(Request $request): JsonResponse
    {
        $search = trim((string)$request->query('search', ''));
        $absenceStatus = $request->query('status');

        $query = HrAbsenceRequest::query()
            ->with('employee')
            ->when($search !== '', function ($q) use ($search) {
                return $q->whereHas('employee', function ($subQ) use ($search) {
                    $subQ->where('employee_number', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->when($absenceStatus !== null && $absenceStatus !== 'all', function ($q) use ($absenceStatus) {
                return $q->where('status', $absenceStatus);
            })
            ->orderByDesc('start_date');

        return response()->json($query->paginate(50));
    }

    public function createAbsence(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'request_type' => ['required', 'in:leave,sick,permission'],
            'leave_type_id' => ['nullable', 'integer'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'total_days' => ['sometimes', 'integer'],
            'reason' => ['required', 'string', 'max:500'],
            'attachment_path' => ['nullable', 'string'],
        ]);

        if (!isset($data['total_days'])) {
            $start = \Carbon\Carbon::parse($data['start_date']);
            $end = \Carbon\Carbon::parse($data['end_date']);
            $data['total_days'] = $start->diffInDays($end) + 1;
        }

        $data['status'] = 'pending';

        $absence = HrAbsenceRequest::create($data);

        return response()->json([
            'message' => 'Pengajuan cuti & izin berhasil diajukan.',
            'data' => $absence->load('employee'),
        ], 201);
    }

    public function updateAbsence(Request $request, HrAbsenceRequest $absence): JsonResponse
    {
        if ($absence->status !== 'pending') {
            return response()->json([
                'message' => 'Tidak bisa mengubah pengajuan yang sudah diproses.',
            ], 422);
        }

        $data = $request->validate([
            'employee_id' => ['sometimes', 'integer', 'exists:employees,id'],
            'request_type' => ['sometimes', 'in:leave,sick,permission'],
            'leave_type_id' => ['nullable', 'integer'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'total_days' => ['sometimes', 'integer'],
            'reason' => ['sometimes', 'string', 'max:500'],
            'attachment_path' => ['nullable', 'string'],
        ]);

        if (!isset($data['total_days']) && isset($data['start_date']) && isset($data['end_date'])) {
            $start = \Carbon\Carbon::parse($data['start_date']);
            $end = \Carbon\Carbon::parse($data['end_date']);
            $data['total_days'] = $start->diffInDays($end) + 1;
        }

        $absence->update($data);

        return response()->json([
            'message' => 'Pengajuan cuti & izin berhasil diperbarui.',
            'data' => $absence->load('employee'),
        ]);
    }

    public function deleteAbsence(Request $request, HrAbsenceRequest $absence): JsonResponse
    {
        if (!in_array($absence->status, ['pending', 'rejected'])) {
            return response()->json([
                'message' => 'Tidak bisa menghapus pengajuan yang sudah disetujui.',
            ], 422);
        }

        $absence->delete();

        return response()->json([
            'message' => 'Pengajuan cuti & izin berhasil dihapus.',
        ]);
    }

    public function approveAbsence(Request $request, HrAbsenceRequest $absence): JsonResponse
    {
        $data = $request->validate([
            'level' => ['required', 'in:supervisor,hr'],
        ]);

        $level = $data['level'];

        if ($level === 'supervisor') {
            if ($absence->status !== 'pending') {
                return response()->json([
                    'message' => 'Status harus pending untuk disetujui supervisor.',
                ], 422);
            }

            $absence->update([
                'status' => 'approved_supervisor',
                'supervisor_approved_by' => $request->user()->id,
                'supervisor_approved_at' => now(),
            ]);
        } elseif ($level === 'hr') {
            if ($absence->status !== 'approved_supervisor') {
                return response()->json([
                    'message' => 'Status harus disetujui supervisor terlebih dahulu.',
                ], 422);
            }

            $absence->update([
                'status' => 'approved_hr',
                'hr_approved_by' => $request->user()->id,
                'hr_approved_at' => now(),
            ]);
        }

        return response()->json([
            'message' => "Pengajuan cuti & izin disetujui oleh " . ($level === 'supervisor' ? 'Supervisor' : 'HR'),
            'data' => $absence->load('employee'),
        ]);
    }

    public function rejectAbsence(Request $request, HrAbsenceRequest $absence): JsonResponse
    {
        if (!in_array($absence->status, ['pending', 'approved_supervisor'])) {
            return response()->json([
                'message' => 'Tidak bisa menolak pengajuan yang sudah final.',
            ], 422);
        }

        $absence->update([
            'status' => 'rejected',
            'approval_notes' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => 'Pengajuan cuti & izin berhasil ditolak.',
            'data' => $absence->load('employee'),
        ]);
    }

    public function overtimes(Request $request): JsonResponse
    {
        return response()->json(HrOvertimeRequest::query()->with('employee:id,employee_number,name')->orderByDesc('id')->paginate(50));
    }

    public function performances(Request $request): JsonResponse 
{ 
    return response()->json(
        HrPerformanceReview::query()
            ->with(['employee:id,employee_number,name', 'items'])
            ->orderByDesc('period_end')
            ->paginate(50)
    ); 
}

    public function trainings(Request $request): JsonResponse
    {
        return response()->json(HrTraining::query()->with('employee:id,employee_number,name')->orderByDesc('start_date')->paginate(50));
    }

    public function offboard(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'type'           => ['required', 'in:resign,termination,retirement,end_contract,other'],
            'effective_date' => ['required', 'date'],
            'reason'         => ['nullable', 'string']
        ]);

        $row = DB::transaction(function () use ($request, $employee, $data) {
            $employee->update([
                'is_active' => false,
                'exit_date' => $data['effective_date']
            ]);

            $userDeactivated = false;

            if ($employee->user) {
                $employee->user->update(['is_active' => false]);
                RoleAssignment::where('user_id', $employee->user->id)->update([
                    'is_active'  => false,
                    'is_default' => false
                ]);
                $userDeactivated = true;
            }

            $employee->unitAssignments()->update([
                'is_active'  => false,
                'is_primary' => false,
                'end_date'   => $data['effective_date']
            ]);

            return HrEmployeeOffboarding::updateOrCreate(
                ['employee_id' => $employee->id],
                array_merge($data, [
                    'employee_deactivated' => true,
                    'user_deactivated'     => $userDeactivated,
                    'roles_revoked'        => $userDeactivated,
                    'units_revoked'        => true,
                    'processed_by'         => $request->user()->id,
                    'processed_at'         => now()
                ])
            );
        });

        return response()->json([
            'message' => 'Offboarding berhasil diproses.',
            'data'    => $row
        ]);
    }
}