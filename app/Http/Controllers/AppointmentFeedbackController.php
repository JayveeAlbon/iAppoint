<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\AppointmentFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AppointmentFeedbackController extends Controller
{
    public function store(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();

        abort_if($appointment->student_id !== $user->id, 403);
        abort_if(! in_array($appointment->status, ['approved', 'completed'], true), 422,
            'Feedback can only be submitted for approved or completed appointments.');
        abort_if(AppointmentFeedback::where('appointment_id', $appointment->id)->exists(), 422,
            'Feedback for this appointment has already been submitted.');

        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        AppointmentFeedback::create([
            'appointment_id' => $appointment->id,
            'student_id'     => $user->id,
            'faculty_id'     => $appointment->faculty_id,
            'rating'         => $data['rating'],
            'comment'        => $data['comment'] ?? null,
        ]);

        return back()->with('success', 'Thanks — your feedback was sent to the faculty.');
    }
}
