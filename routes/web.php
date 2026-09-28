<?php

use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\AuditController as AdminAuditController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AdminFeedbackController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AppointmentFeedbackController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\FacultyStatusController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScheduleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'active'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'active'])->group(function () {

    // ── Faculty directory + map ───────────────────────────────────────────────
    Route::get('/faculty', [FacultyController::class, 'index'])->name('faculty.directory');
    Route::get('/faculty/map', [FacultyController::class, 'map'])->name('faculty.map');
    Route::get('/faculty/{faculty}/schedule', [FacultyController::class, 'schedule'])->name('faculty.schedule');

    // ── Faculty-only: location consent + GPS ─────────────────────────────────
    Route::post('/faculty/consent', [FacultyController::class, 'storeConsent'])->name('faculty.consent');
    Route::delete('/faculty/consent', [FacultyController::class, 'revokeConsent'])->name('faculty.consent.revoke');
    Route::patch('/faculty/location', [FacultyController::class, 'updateLocation'])->name('faculty.location.update');
    Route::delete('/faculty/location', [FacultyController::class, 'clearLocation'])->name('faculty.location.clear');

    // ── Faculty-only: schedule management ────────────────────────────────────
    Route::get('/schedule', [ScheduleController::class, 'index'])->name('schedule.index');
    Route::post('/schedule', [ScheduleController::class, 'store'])->name('schedule.store');
    Route::put('/schedule/{schedule}', [ScheduleController::class, 'update'])->name('schedule.update');
    Route::delete('/schedule/{schedule}', [ScheduleController::class, 'destroy'])->name('schedule.destroy');

    // ── Friends ───────────────────────────────────────────────────────────────
    Route::get('/friends', [FriendController::class, 'index'])->name('friends.index');
    Route::post('/friends', [FriendController::class, 'store'])->name('friends.store');
    Route::patch('/friends/{friendship}', [FriendController::class, 'update'])->name('friends.update');
    Route::delete('/friends/{friendship}', [FriendController::class, 'destroy'])->name('friends.destroy');

    // ── Conversations / Messages ──────────────────────────────────────────────
    Route::get('/messages', [ConversationController::class, 'index'])->name('messages.index');
    Route::post('/messages', [ConversationController::class, 'store'])->name('messages.store');
    Route::get('/messages/{conversation}', [ConversationController::class, 'show'])->name('messages.show');
    Route::post('/messages/{conversation}/send', [ConversationController::class, 'sendMessage'])->name('messages.send');

    // ── Meetings ──────────────────────────────────────────────────────────────
    Route::get('/meetings', [MeetingController::class, 'index'])->name('meetings.index');
    Route::post('/meetings', [MeetingController::class, 'store'])->name('meetings.store');
    Route::get('/meetings/{meeting}', [MeetingController::class, 'show'])->name('meetings.show');
    Route::patch('/meetings/{meeting}/status', [MeetingController::class, 'update'])->name('meetings.status');
    Route::patch('/meetings/{meeting}/respond', [MeetingController::class, 'respond'])->name('meetings.respond');
    Route::delete('/meetings/{meeting}', [MeetingController::class, 'destroy'])->name('meetings.destroy');

    // ── Appointments ─────────────────────────────────────────────────────────
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');
    Route::post('/appointments/{appointment}/feedback', [AppointmentFeedbackController::class, 'store'])->name('appointments.feedback.store');

    // ── User feedback / snapshots to admin (issue tracker) ───────────────────
    Route::post('/user-feedback', [AdminFeedbackController::class, 'store'])->name('user-feedback.store');

    // ── Faculty status + catering sessions ───────────────────────────────────
    Route::get('/faculty-status', [FacultyStatusController::class, 'index'])->name('faculty-status.index');
    Route::post('/catering', [FacultyStatusController::class, 'startCatering'])->name('catering.start');
    Route::delete('/catering/{session}', [FacultyStatusController::class, 'endCatering'])->name('catering.end');
    Route::delete('/catering', [FacultyStatusController::class, 'clearAll'])->name('catering.clear');

    // ── Administration (admin only) ───────────────────────────────────────────
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users/{user}/approve', [AdminUserController::class, 'approve'])->name('users.approve');
        Route::delete('/users/{user}/reject', [AdminUserController::class, 'reject'])->name('users.reject');
        Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
        Route::get('/appointments', [AdminAppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments/{appointment}/approve', [AdminAppointmentController::class, 'approve'])->name('appointments.approve');
        Route::patch('/appointments/{appointment}/reject', [AdminAppointmentController::class, 'reject'])->name('appointments.reject');
        Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
        Route::get('/audit', [AdminAuditController::class, 'index'])->name('audit.index');
        Route::get('/settings', fn() => Inertia::render('Admin/Settings/Index'))->name('settings.index');
        Route::get('/feedback', [AdminFeedbackController::class, 'index'])->name('feedback.index');
        Route::post('/feedback/{feedback}/resolve', [AdminFeedbackController::class, 'resolve'])->name('feedback.resolve');
        Route::delete('/feedback/{feedback}', [AdminFeedbackController::class, 'destroy'])->name('feedback.destroy');
    });
});

require __DIR__.'/auth.php';
