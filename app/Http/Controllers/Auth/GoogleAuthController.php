<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\UserRegisteredForAdminNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    public function callback(Request $request): RedirectResponse
    {
        $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $clientId = config('services.google.client_id');

        if (! $clientId) {
            throw ValidationException::withMessages([
                'credential' => 'Google Sign-In is not configured on this server.',
            ]);
        }

        $response = Http::acceptJson()
            ->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $request->string('credential'),
            ]);

        if (! $response->ok()) {
            throw ValidationException::withMessages([
                'credential' => 'Could not verify Google credentials. Please try again.',
            ]);
        }

        $payload = $response->json();

        if (($payload['aud'] ?? null) !== $clientId) {
            throw ValidationException::withMessages([
                'credential' => 'Google token was not issued for this application.',
            ]);
        }

        $emailVerified = $payload['email_verified'] ?? false;
        if ($emailVerified !== true && $emailVerified !== 'true') {
            throw ValidationException::withMessages([
                'credential' => 'Your Google account email is not verified.',
            ]);
        }

        $email = strtolower($payload['email'] ?? '');
        $googleId = $payload['sub'] ?? null;
        $name = $payload['name'] ?? ($payload['given_name'] ?? null) ?? strstr($email, '@', true);
        $picture = $payload['picture'] ?? null;

        if (! $email || ! $googleId) {
            throw ValidationException::withMessages([
                'credential' => 'Google did not return the expected profile information.',
            ]);
        }

        $user = User::where('email', $email)->first();
        $wasCreated = false;

        if (! $user) {
            $user = User::create([
                'name'              => $name,
                'email'             => $email,
                'google_id'         => $googleId,
                'avatar'            => $picture,
                'role'              => 'student',
                'status'            => 'pending',
                'email_verified_at' => now(),
            ]);
            $wasCreated = true;

            $this->notifyAdminsOfNewUser($user);
        } elseif (! $user->google_id) {
            $user->google_id = $googleId;
            $user->save();
        }

        if ($user->status === 'pending') {
            $redirect = redirect('/');

            if ($wasCreated) {
                $redirect->with('registered', [
                    'name'  => $user->name,
                    'email' => $user->email,
                ]);
            } else {
                $redirect->with('status', 'Your account is still pending approval. Please wait for the admin to approve it.');
            }

            return $redirect;
        }

        if ($user->status === 'suspended') {
            return redirect('/')
                ->with('error', 'This account has been suspended. Please contact the administrator.');
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function notifyAdminsOfNewUser(User $user): void
    {
        try {
            $admins = User::where('role', 'admin')
                ->where('status', 'active')
                ->whereNotNull('email')
                ->get();

            if ($admins->isNotEmpty()) {
                Notification::send($admins, new UserRegisteredForAdminNotification($user));
            }

            $configured = config('services.admin_notify_email');
            if ($configured) {
                Notification::route('mail', $configured)
                    ->notify(new UserRegisteredForAdminNotification($user));
            }
        } catch (\Throwable $e) {
            // Don't let mail failures block sign-up.
            Log::warning('New user admin notification failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }
    }
}
