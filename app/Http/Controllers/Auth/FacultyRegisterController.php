<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class FacultyRegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/FacultyRegister');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'employee_id'     => 'required|string|max:50|unique:'.User::class,
            'department'      => 'required|string|max:255',
            'office_location' => 'required|string|max:255',
            'password'        => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name'            => $request->name,
            'email'           => $request->email,
            'password'        => Hash::make($request->password),
            'role'            => 'faculty',
            'employee_id'     => $request->employee_id,
            'department'      => $request->department,
            'office_location' => $request->office_location,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
