<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'student_id' => 'required|string|max:50|unique:'.User::class,
            'course'     => 'required|string|max:255',
            'year_level' => 'required|in:1st Year,2nd Year,3rd Year,4th Year,5th Year',
            'password'   => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => 'student',
            'status'     => 'active',
            'student_id' => $request->student_id,
            'course'     => $request->course,
            'year_level' => $request->year_level,
        ]);

        $this->audit->log('user.registered', $user, [
            'name'  => $user->name,
            'email' => $user->email,
        ], $user);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
