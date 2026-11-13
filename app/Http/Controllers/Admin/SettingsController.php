<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(Request $request): Response
    {
        abort_if(!$request->user()->isAdmin(), 403);

        return Inertia::render('Admin/Settings/Index', [
            'isAlsoFaculty' => (bool) $request->user()->is_also_faculty,
        ]);
    }

    public function toggleFacultyMode(Request $request): RedirectResponse
    {
        abort_if(!$request->user()->isAdmin(), 403);

        $request->user()->update([
            'is_also_faculty' => !$request->user()->is_also_faculty,
        ]);

        $newValue = (bool) $request->user()->fresh()->is_also_faculty;
        $status   = $newValue ? 'enabled' : 'disabled';

        return redirect()->route('admin.settings.index')
            ->with('success', "Faculty mode {$status}. Changes take effect immediately.");
    }
}
