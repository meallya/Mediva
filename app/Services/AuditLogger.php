<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function log(
        Request $request,
        string $action,
        ?string $module = null,
        ?string $description = null,
        ?User $user = null,
        ?int $assignmentId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): ActivityLog {

        $user ??= $request->user();

        $assignmentId ??= $request
            ->session()
            ->get('active_assignment_id');


        return ActivityLog::create([
            'user_id' =>
                $user?->id,

            'role_assignment_id' =>
                $assignmentId,

            'action' =>
                $action,

            'module' =>
                $module,

            'description' =>
                $description,

            'method' =>
                $request->method(),

            'endpoint' =>
                $request->path(),

            'ip_address' =>
                $request->ip(),

            'user_agent' =>
                $request->userAgent(),

            'old_values' =>
                $oldValues,

            'new_values' =>
                $newValues,
        ]);
    }
}