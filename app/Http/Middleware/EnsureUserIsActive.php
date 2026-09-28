<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status !== 'active') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            $message = match ($user->status) {
                'pending'   => 'Your account is awaiting admin approval.',
                'suspended' => 'Your account has been suspended. Please contact an administrator.',
                default     => 'Your account is not active.',
            };

            return redirect()->route('login')->withErrors(['email' => $message]);
        }

        return $next($request);
    }
}
