<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\StudentSubject;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $enrolledSubjects = $user->role === 'student'
            ? StudentSubject::where('user_id', $user->id)->orderBy('subject_name')->get()
            : collect();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail'  => $request->user() instanceof MustVerifyEmail,
            'status'           => session('status'),
            'enrolledSubjects' => $enrolledSubjects,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = $request->user();
        $destination = public_path('avatars');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        if ($user->avatar) {
            $old = public_path($user->avatar);
            if (is_file($old)) {
                @unlink($old);
            }
        }

        $file = $request->file('avatar');
        $filename = uniqid('avatar_', true) . '.' . $file->getClientOriginalExtension();
        $file->move($destination, $filename);

        $user->update(['avatar' => 'avatars/' . $filename]);

        return Redirect::route('profile.edit')->with('status', 'avatar-updated');
    }

    public function storeSubject(Request $request): RedirectResponse
    {
        abort_if($request->user()->role !== 'student', 403);

        $data = $request->validate([
            'subject_code' => 'nullable|string|max:50',
            'subject_name' => 'required|string|max:255',
            'instructor'   => 'nullable|string|max:255',
        ]);

        StudentSubject::create([
            'user_id'      => $request->user()->id,
            'subject_code' => $data['subject_code'] ?? null,
            'subject_name' => $data['subject_name'],
            'instructor'   => $data['instructor'] ?? null,
        ]);

        return Redirect::route('profile.edit')->with('status', 'subject-added');
    }

    public function destroySubject(Request $request, StudentSubject $subject): RedirectResponse
    {
        abort_if($subject->user_id !== $request->user()->id, 403);
        $subject->delete();
        return Redirect::route('profile.edit')->with('status', 'subject-removed');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
