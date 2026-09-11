<?php

namespace App\Http\Middleware;

use App\Models\RoleAssignment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasPermission
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {
        /*
        |--------------------------------------------------------------------------
        | USER
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Anda belum login.',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | ACTIVE ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        $assignmentId = $request
            ->session()
            ->get('active_assignment_id');

        if (!$assignmentId) {
            return response()->json([
                'message' => 'Role aktif tidak ditemukan.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | ROLE + PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $assignment = RoleAssignment::with([
            'role.permissions',
        ])
            ->where('id', $assignmentId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$assignment) {
            return response()->json([
                'message' => 'Role aktif tidak valid.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK PERMISSION
        |--------------------------------------------------------------------------
        |
        | Tidak ada bypass khusus IT.
        |
        | Semua role mengikuti permission masing-masing.
        |
        */

        $hasPermission = $assignment
            ->role
            ->permissions
            ->contains(
                'slug',
                $permission
            );

        if (!$hasPermission) {
            return response()->json([
                'message' =>
                    'Anda tidak memiliki izin untuk mengakses fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}