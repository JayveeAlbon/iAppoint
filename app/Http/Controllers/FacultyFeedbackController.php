<?php

namespace App\Http\Controllers;

use App\Models\UserFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultyFeedbackController extends Controller
{
    public function index(Request $request): Response
    {
        abort_if($request->user()->role !== 'faculty', 403);

        $feedbacks = UserFeedback::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Faculty/FacultyFeedback', [
            'feedbacks' => $feedbacks,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_if($request->user()->role !== 'faculty', 403);

        $user = $request->user();

        $data = $request->validate([
            'feedback_tab' => 'required|in:system,services',
            'category'     => 'required|string|max:100',
            'priority'     => 'required|string|max:20',
            'subject'      => 'required|string|max:200',
            'message'      => 'required|string|max:5000',
            'suggestions'  => 'nullable|string|max:1000',
            'screenshot'   => 'nullable|image|mimes:png,jpg,jpeg,gif|max:5120',
            'document'     => 'nullable|file|mimes:png,jpg,jpeg,gif,pdf|max:5120',
            'page_url'     => 'nullable|string|max:500',
        ]);

        $screenshotPath = null;
        if ($request->hasFile('screenshot')) {
            $dest = public_path('feedback-screenshots');
            if (!is_dir($dest)) @mkdir($dest, 0775, true);
            $file = $request->file('screenshot');
            $filename = uniqid('fb_', true) . '.' . $file->getClientOriginalExtension();
            $file->move($dest, $filename);
            $screenshotPath = 'feedback-screenshots/' . $filename;
        }

        $documentPath = null;
        if ($request->hasFile('document')) {
            $dest = public_path('feedback-documents');
            if (!is_dir($dest)) @mkdir($dest, 0775, true);
            $file = $request->file('document');
            $filename = uniqid('doc_', true) . '.' . $file->getClientOriginalExtension();
            $file->move($dest, $filename);
            $documentPath = 'feedback-documents/' . $filename;
        }

        try {
            UserFeedback::create([
                'user_id'         => $user->id,
                'feedback_tab'    => $data['feedback_tab'],
                'category'        => $data['category'],
                'priority'        => $data['priority'],
                'subject'         => $data['subject'],
                'message'         => $data['message'],
                'suggestions'     => $data['suggestions'] ?? null,
                'page_url'        => $data['page_url'] ?? request()->url(),
                'screenshot_path' => $screenshotPath,
                'document_path'   => $documentPath,
            ]);
        } catch (\Throwable $e) {
            UserFeedback::create([
                'user_id'         => $user->id,
                'category'        => $data['category'],
                'subject'         => $data['subject'],
                'message'         => $data['message'] . "\n\n[Priority: " . $data['priority'] . "] [Tab: " . $data['feedback_tab'] . "]",
                'page_url'        => $data['page_url'] ?? request()->url(),
                'screenshot_path' => $screenshotPath,
            ]);
        }

        return back()->with('success', 'Thank you! Your feedback has been submitted to the admin.');
    }
}
