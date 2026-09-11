<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{

    public function index(
        Request $request
    ) {
        $logs = ActivityLog::query()
            ->with([
                'user:id,name,username',

                'roleAssignment.role:id,name,slug',

                'roleAssignment.unit:id,name,code',
            ])
            ->latest('created_at')
            ->paginate(20);

        return response()->json(
            $logs
        );
    }
}