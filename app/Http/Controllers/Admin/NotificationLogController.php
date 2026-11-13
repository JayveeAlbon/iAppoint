<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use App\Services\NotificationLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationLogController extends Controller
{
    public function __construct(private readonly NotificationLogService $logger) {}

    public function index(Request $request): Response
    {
        abort_if(!auth()->user()->isAdmin(), 403);

        $query = NotificationLog::with(['appointment:id,title,requested_at,status'])
            ->orderByDesc('created_at');

        // ── Filters ───────────────────────────────────────────────────────────
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('recipient_name',  'like', "%{$search}%")
                  ->orWhere('recipient_email', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('type')) {
            $query->where('notification_type', $type);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($date = $request->query('date')) {
            $query->whereDate('created_at', $date);
        }

        if ($sort = $request->query('sort')) {
            $query->reorder('created_at', $sort === 'oldest' ? 'asc' : 'desc');
        }

        $logs = $query->paginate(20)->withQueryString();

        // ── Summary counts ────────────────────────────────────────────────────
        $counts = [
            'total'   => NotificationLog::count(),
            'sent'    => NotificationLog::where('status', 'sent')->count(),
            'failed'  => NotificationLog::where('status', 'failed')->count(),
            'pending' => NotificationLog::where('status', 'pending')->count(),
        ];

        return Inertia::render('Admin/NotificationLogs/Index', [
            'logs'    => $logs,
            'counts'  => $counts,
            'filters' => $request->only(['search', 'type', 'status', 'date', 'sort']),
            'types'   => NotificationLog::TYPE_LABELS,
        ]);
    }

    public function show(NotificationLog $notificationLog): JsonResponse
    {
        abort_if(!auth()->user()->isAdmin(), 403);

        $notificationLog->load(['appointment.student:id,name,email,course,year_level',
                                'appointment.faculty:id,name,email,department']);

        return response()->json([
            'log' => [
                'id'                => $notificationLog->id,
                'recipient_name'    => $notificationLog->recipient_name,
                'recipient_email'   => $notificationLog->recipient_email,
                'notification_type' => $notificationLog->notification_type,
                'label'             => $notificationLog->label,
                'email_subject'     => $notificationLog->email_subject,
                'email_preview'     => $notificationLog->email_preview,
                'status'            => $notificationLog->status,
                'error_message'     => $notificationLog->error_message,
                'sent_at'           => $notificationLog->sent_at?->toIso8601String(),
                'created_at'        => $notificationLog->created_at->toIso8601String(),
                'appointment'       => $notificationLog->appointment ? [
                    'id'           => $notificationLog->appointment->id,
                    'title'        => $notificationLog->appointment->title,
                    'requested_at' => $notificationLog->appointment->requested_at?->toIso8601String(),
                    'status'       => $notificationLog->appointment->status,
                    'student'      => $notificationLog->appointment->student?->only('id','name','email','course','year_level'),
                    'faculty'      => $notificationLog->appointment->faculty?->only('id','name','email','department'),
                ] : null,
            ],
        ]);
    }

    public function retry(NotificationLog $notificationLog): RedirectResponse
    {
        abort_if(!auth()->user()->isAdmin(), 403);
        abort_if($notificationLog->status !== 'failed', 422);

        $this->logger->retry($notificationLog);

        $result = $notificationLog->fresh();

        return back()->with(
            $result->status === 'sent' ? 'success' : 'error',
            $result->status === 'sent'
                ? "Email successfully resent to {$result->recipient_name}."
                : "Retry failed: {$result->error_message}"
        );
    }
}
