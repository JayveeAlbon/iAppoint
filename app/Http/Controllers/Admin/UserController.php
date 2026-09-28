<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\UserApprovedNotification;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function index(Request $request): Response
    {
        abort_if(! $request->user()->isAdmin(), 403);

        $query = User::withCount('schedules')
            ->with('facultyStatus')
            ->orderByRaw("FIELD(status,'pending','active','suspended')")
            ->orderBy('name');

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('q')) {
            $query->where(fn($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
            );
        }

        $users = $query->paginate(25)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'filters' => $request->only('q', 'role', 'status'),
            'counts'  => [
                'total'     => User::count(),
                'pending'   => User::where('status', 'pending')->count(),
                'active'    => User::where('status', 'active')->count(),
                'suspended' => User::where('status', 'suspended')->count(),
                'faculty'   => User::where('role', 'faculty')->count(),
                'student'   => User::where('role', 'student')->count(),
                'admin'     => User::where('role', 'admin')->count(),
            ],
        ]);
    }

    public function approve(Request $request, User $user): RedirectResponse
    {
        abort_if(! $request->user()->isAdmin(), 403);

        $user->update([
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->audit->log('user.approved', $user, [
            'name'  => $user->name,
            'email' => $user->email,
        ]);

        try {
            if ($user->email) {
                $user->notify(new UserApprovedNotification());
            }
        } catch (\Throwable $e) {
            Log::warning('User approval mail failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }

        return back()->with('success', "{$user->name} approved and notified by email.");
    }

    public function reject(Request $request, User $user): RedirectResponse
    {
        abort_if(! $request->user()->isAdmin(), 403);

        $this->audit->log('user.rejected', null, [
            'name'  => $user->name,
            'email' => $user->email,
        ]);

        $user->delete();

        return back()->with('success', "Registration for {$user->name} rejected and removed.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_if(! $request->user()->isAdmin(), 403);
        abort_if($user->id === $request->user()->id, 403, 'Cannot modify your own account here.');

        $validated = $request->validate([
            'role'            => ['sometimes', Rule::in(['student', 'faculty', 'admin'])],
            'status'          => ['sometimes', Rule::in(['active', 'suspended'])],
            'department'      => 'sometimes|nullable|string|max:200',
            'office_location' => 'sometimes|nullable|string|max:200',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'active') {
            $validated['email_verified_at'] = $user->email_verified_at ?? now();
        }

        $old = $user->only(array_keys($validated));
        $user->update($validated);

        $this->audit->log('user.updated', $user, ['from' => $old, 'to' => $validated]);

        return back()->with('success', 'User updated.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_if(! $request->user()->isAdmin(), 403);
        abort_if($user->id === $request->user()->id, 403, 'Cannot delete your own account.');

        $this->audit->log('user.deleted', null, [
            'name'  => $user->name,
            'email' => $user->email,
        ]);

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }
}
