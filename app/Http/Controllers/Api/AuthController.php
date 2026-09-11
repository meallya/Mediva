<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    public function login(Request $request)
    {
        $request->validate([
            'username' => [
                'required',
                'string',
            ],
            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = User::query()
            ->where(
                'username',
                $request->username
            )
            ->first();

        if (
            !$user ||
            !Hash::check(
                $request->password,
                $user->password
            )
        ) {
            return response()->json([
                'message' =>
                    'Username atau password salah.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' =>
                    'Akun tidak aktif.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | LOGIN SESSION
        |--------------------------------------------------------------------------
        */

        Auth::guard('web')->login(
            $user,
            $request->boolean('remember')
        );

        $request
            ->session()
            ->regenerate();

        /*
        |--------------------------------------------------------------------------
        | DEFAULT ROLE
        |--------------------------------------------------------------------------
        */

        $activeAssignment =
            $this->getDefaultAssignment(
                $user
            );

        if (!$activeAssignment) {
            Auth::guard('web')
                ->logout();

            $request
                ->session()
                ->invalidate();

            $request
                ->session()
                ->regenerateToken();

            return response()->json([
                'message' =>
                    'Akun belum memiliki role aktif.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | SIMPAN ACTIVE ROLE
        |--------------------------------------------------------------------------
        */

        $request
            ->session()
            ->put(
                'active_assignment_id',
                $activeAssignment->id
            );

        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $permissions =
            $activeAssignment
                ->role
                ->permissions
                ->pluck('slug')
                ->values()
                ->toArray();

        /*
        |--------------------------------------------------------------------------
        | AUDIT LOGIN
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action: 'auth.login',
            module: 'auth',
            description: 'User berhasil login ke MEDIVA.',
            user: $user,
            assignmentId: $activeAssignment->id,
            newValues: [
                'role' =>
                    $activeAssignment
                        ->role
                        ->name,

                'unit' =>
                    $activeAssignment
                        ->unit
                        ?->name,
            ],
        );

        return response()->json([
            'message' =>
                'Login berhasil.',

            'user' =>
                $this->formatUser(
                    $user
                ),

            'roles' =>
                $this->getUserRoles(
                    $user
                ),

            'active_role' =>
                $this->formatAssignment(
                    $activeAssignment
                ),

            'permissions' =>
                $permissions,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

    public function me(Request $request)
    {
        $user = $request->user();

        $activeAssignmentId =
            $request
                ->session()
                ->get(
                    'active_assignment_id'
                );

        $activeAssignment = null;

        if ($activeAssignmentId) {
            $activeAssignment =
                $user
                    ->roleAssignments()
                    ->with([
                        'role.permissions',
                        'unit',
                    ])
                    ->where(
                        'id',
                        $activeAssignmentId
                    )
                    ->where(
                        'is_active',
                        true
                    )
                    ->first();
        }

        /*
        |--------------------------------------------------------------------------
        | FALLBACK DEFAULT ROLE
        |--------------------------------------------------------------------------
        */

        if (!$activeAssignment) {
            $activeAssignment =
                $this
                    ->getDefaultAssignment(
                        $user
                    );

            if ($activeAssignment) {
                $request
                    ->session()
                    ->put(
                        'active_assignment_id',
                        $activeAssignment->id
                    );
            }
        }

        $activeRole = null;
        $permissions = [];

        if ($activeAssignment) {
            $activeRole =
                $this->formatAssignment(
                    $activeAssignment
                );

            $permissions =
                $activeAssignment
                    ->role
                    ->permissions
                    ->pluck('slug')
                    ->values()
                    ->toArray();
        }

        return response()->json([
            'user' =>
                $this->formatUser(
                    $user
                ),

            'roles' =>
                $this->getUserRoles(
                    $user
                ),

            'active_role' =>
                $activeRole,

            'permissions' =>
                $permissions,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SWITCH ROLE
    |--------------------------------------------------------------------------
    */

    public function switchRole(
        Request $request
    ) {
        $request->validate([
            'assignment_id' => [
                'required',
                'integer',
            ],
        ]);

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | ROLE LAMA
        |--------------------------------------------------------------------------
        */

        $oldAssignmentId =
            $request
                ->session()
                ->get(
                    'active_assignment_id'
                );

        $oldAssignment =
            $oldAssignmentId
                ? $user
                    ->roleAssignments()
                    ->with([
                        'role',
                        'unit',
                    ])
                    ->find(
                        $oldAssignmentId
                    )
                : null;

        /*
        |--------------------------------------------------------------------------
        | ROLE BARU
        |--------------------------------------------------------------------------
        */

        $assignment =
            $user
                ->roleAssignments()
                ->with([
                    'role.permissions',
                    'unit',
                ])
                ->where(
                    'id',
                    $request->assignment_id
                )
                ->where(
                    'is_active',
                    true
                )
                ->first();

        if (!$assignment) {
            return response()->json([
                'message' =>
                    'Role assignment tidak valid.',
            ], 403);
        }

        if (
            !$assignment
                ->role
                ->is_active
        ) {
            return response()->json([
                'message' =>
                    'Role sudah tidak aktif.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | SIMPAN ROLE BARU
        |--------------------------------------------------------------------------
        */

        $request
            ->session()
            ->put(
                'active_assignment_id',
                $assignment->id
            );

        $permissions =
            $assignment
                ->role
                ->permissions
                ->pluck('slug')
                ->values()
                ->toArray();

        /*
        |--------------------------------------------------------------------------
        | AUDIT SWITCH ROLE
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action: 'auth.switch_role',
            module: 'auth',
            description: 'User mengganti role aktif.',
            user: $user,
            assignmentId: $assignment->id,

            oldValues: [
                'assignment_id' =>
                    $oldAssignment?->id,

                'role' =>
                    $oldAssignment
                        ?->role
                        ?->name,

                'unit' =>
                    $oldAssignment
                        ?->unit
                        ?->name,
            ],

            newValues: [
                'assignment_id' =>
                    $assignment->id,

                'role' =>
                    $assignment
                        ->role
                        ->name,

                'unit' =>
                    $assignment
                        ->unit
                        ?->name,
            ],
        );

        return response()->json([
            'message' =>
                'Role berhasil diaktifkan.',

            'user' =>
                $this->formatUser(
                    $user
                ),

            'roles' =>
                $this->getUserRoles(
                    $user
                ),

            'active_role' =>
                $this->formatAssignment(
                    $assignment
                ),

            'permissions' =>
                $permissions,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    public function logout(
        Request $request
    ) {
        /*
        |--------------------------------------------------------------------------
        | SIMPAN DATA SEBELUM SESSION DIHAPUS
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        $assignmentId =
            $request
                ->session()
                ->get(
                    'active_assignment_id'
                );

        /*
        |--------------------------------------------------------------------------
        | AUDIT LOGOUT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action: 'auth.logout',
            module: 'auth',
            description: 'User logout dari MEDIVA.',
            user: $user,
            assignmentId: $assignmentId,
        );

        /*
        |--------------------------------------------------------------------------
        | LOGOUT SESSION
        |--------------------------------------------------------------------------
        */

        Auth::guard('web')
            ->logout();

        $request
            ->session()
            ->invalidate();

        $request
            ->session()
            ->regenerateToken();

        return response()->json([
            'message' =>
                'Logout berhasil.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DEFAULT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    private function getDefaultAssignment(
        $user
    ) {
        return $user
            ->roleAssignments()
            ->with([
                'role.permissions',
                'unit',
            ])
            ->where(
                'is_active',
                true
            )
            ->whereHas(
                'role',
                function ($query) {
                    $query->where(
                        'is_active',
                        true
                    );
                }
            )
            ->orderByDesc(
                'is_default'
            )
            ->orderBy('id')
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | USER ROLES
    |--------------------------------------------------------------------------
    */

    private function getUserRoles(
        $user
    ) {
        return $user
            ->roleAssignments()
            ->with([
                'role',
                'unit',
            ])
            ->where(
                'is_active',
                true
            )
            ->whereHas(
                'role',
                function ($query) {
                    $query->where(
                        'is_active',
                        true
                    );
                }
            )
            ->get()
            ->map(
                function (
                    $assignment
                ) {
                    return $this
                        ->formatAssignment(
                            $assignment
                        );
                }
            )
            ->values();
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT USER
    |--------------------------------------------------------------------------
    */

    private function formatUser(
        $user
    ) {
        return [
            'id' =>
                $user->id,

            'name' =>
                $user->name,

            'username' =>
                $user->username,

            'email' =>
                $user->email,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    private function formatAssignment(
        $assignment
    ) {
        return [
            'assignment_id' =>
                $assignment->id,

            'id' =>
                $assignment
                    ->role
                    ->id,

            'name' =>
                $assignment
                    ->role
                    ->name,

            'slug' =>
                $assignment
                    ->role
                    ->slug,

            'description' =>
                $assignment
                    ->role
                    ->description,

            'unit' =>
                $assignment->unit
                    ? [
                        'id' =>
                            $assignment
                                ->unit
                                ->id,

                        'name' =>
                            $assignment
                                ->unit
                                ->name,

                        'code' =>
                            $assignment
                                ->unit
                                ->code,
                    ]
                    : null,
        ];
    }
}