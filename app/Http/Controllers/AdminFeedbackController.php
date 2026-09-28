<?php

namespace App\Http\Controllers;

use App\Models\UserFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminFeedbackController extends Controller
{
    // ── User (student/faculty) submits feedback ──────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'category'   => 'required|string|max:40',
            'subject'    => 'required|string|max:200',
            'message'    => 'required|string|max:5000',
            'page_url'   => 'nullable|string|max:500',
            'screenshot' => 'nullable|image|max:5120', // 5 MB
        ]);

        $path = null;
        if ($request->hasFile('screenshot')) {
            $destination = public_path('feedback-screenshots');
            if (! is_dir($destination)) {
                @mkdir($destination, 0775, true);
            }
            $file = $request->file('screenshot');
            $filename = uniqid('fb_', true) . '.' . ($file->getClientOriginalExtension() ?: 'png');
            $file->move($destination, $filename);
            $path = 'feedback-screenshots/' . $filename;
        }

        UserFeedback::create([
            'user_id'         => $user->id,
            'category'        => $data['category'],
            'subject'         => $data['subject'],
            'message'         => $data['message'],
            'page_url'        => $data['page_url'] ?? null,
            'screenshot_path' => $path,
        ]);

        return back()->with('success', 'Thanks — your feedback was sent to the administrators.');
    }

    // ── Admin: list feedback ─────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $status = $request->query('status', 'all');

        $feedback = UserFeedback::with('user:id,name,role,avatar,department,course')
            ->when($status !== 'all', fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $counts = [
            'open'     => UserFeedback::where('status', 'open')->count(),
            'resolved' => UserFeedback::where('status', 'resolved')->count(),
            'total'    => UserFeedback::count(),
        ];

        return Inertia::render('Admin/Feedback/Index', [
            'feedback' => $feedback,
            'counts'   => $counts,
            'filters'  => ['status' => $status],
        ]);
    }

    // ── Admin: mark resolved ─────────────────────────────────────────────────
    public function resolve(Request $request, UserFeedback $feedback): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $feedback->update([
            'status'      => 'resolved',
            'resolved_at' => now(),
        ]);

        return back()->with('success', 'Feedback marked as resolved.');
    }

    // ── Admin: delete feedback (also removes attached screenshot) ────────────
    public function destroy(Request $request, UserFeedback $feedback): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        if ($feedback->screenshot_path) {
            $abs = public_path($feedback->screenshot_path);
            if (is_file($abs)) {
                @unlink($abs);
            }
        }
        $feedback->delete();

        return back()->with('success', 'Feedback deleted.');
    }
}
