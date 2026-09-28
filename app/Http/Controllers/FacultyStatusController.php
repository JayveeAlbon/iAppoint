<?php

namespace App\Http\Controllers;

use App\Http\Requests\StartCateringRequest;
use App\Models\Appointment;
use App\Models\CateringSession;
use App\Models\User;
use App\Services\FacultyStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultyStatusController extends Controller
{
    public function __construct(private readonly FacultyStatusService $statusService) {}

    public function index(Request $request): Response
    {
        abort_if(! $request->user()->isFaculty(), 403);

        $faculty = $request->user();
        $faculty->load('facultyStatus');

        $activeSessions = $this->statusService->activeSessions($faculty);

        // Active session student IDs to exclude from appointment buttons
        $cateringStudentIds = $activeSessions->pluck('student_id')->all();

        $approvedAppointments = Appointment::where('faculty_id', $faculty->id)
            ->where('status', 'approved')
            ->with('student:id,name,course,year_level,avatar')
            ->orderBy('requested_at')
            ->get();

        $students = User::where('role', 'student')
            ->where('status', 'active')
            ->select('id', 'name', 'course', 'year_level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Faculty/StatusManager', [
            'facultyStatus'        => $faculty->facultyStatus,
            'activeSessions'       => $activeSessions,
            'approvedAppointments' => $approvedAppointments,
            'cateringStudentIds'   => $cateringStudentIds,
            'students'             => $students,
        ]);
    }

    public function startCatering(StartCateringRequest $request): RedirectResponse
    {
        $student = User::findOrFail($request->student_id);
        abort_if($student->role !== 'student', 422, 'Target must be a student.');

        $this->statusService->startSession($request->user(), $student);

        return back()->with('success', 'Catering session started.');
    }

    public function endCatering(Request $request, CateringSession $session): RedirectResponse
    {
        $this->authorize('end', $session);

        $this->statusService->endSession($session);

        return back()->with('success', 'Session ended.');
    }

    public function clearAll(Request $request): RedirectResponse
    {
        abort_if(! $request->user()->isFaculty(), 403);

        $this->statusService->clearAll($request->user());

        return back()->with('success', 'All sessions cleared.');
    }
}
