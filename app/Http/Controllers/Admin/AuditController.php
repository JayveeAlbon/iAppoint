<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        abort_if(! $request->user()->isAdmin(), 403);

        $query = AuditLog::with('causer:id,name,role')
            ->orderByDesc('created_at');

        if ($event = $request->input('event')) {
            $query->where('event', 'like', "{$event}%");
        }

        if ($search = $request->input('q')) {
            $query->whereHas('causer', fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            );
        }

        if ($from = $request->input('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $logs = $query->paginate(50)->withQueryString();

        $eventGroups = AuditLog::selectRaw('SUBSTRING_INDEX(event, ".", 1) as grp')
            ->distinct()
            ->orderBy('grp')
            ->pluck('grp');

        return Inertia::render('Admin/AuditTrail/Index', [
            'logs'        => $logs,
            'filters'     => $request->only('q', 'event', 'from', 'to'),
            'eventGroups' => $eventGroups,
        ]);
    }
}
