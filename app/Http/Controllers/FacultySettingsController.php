<?php

namespace App\Http\Controllers;

use App\Models\FacultySubject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultySettingsController extends Controller
{
    public function index(): Response
    {
        abort_if(auth()->user()->role !== 'faculty', 403);

        $subjects = FacultySubject::where('user_id', auth()->id())
            ->orderBy('name')
            ->get();

        return Inertia::render('Faculty/Settings', [
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_if(auth()->user()->role !== 'faculty', 403);

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        FacultySubject::create([
            'user_id'     => auth()->id(),
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('success', 'Subject added.');
    }

    public function update(Request $request, FacultySubject $subject): RedirectResponse
    {
        abort_if($subject->user_id !== auth()->id(), 403);

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $subject->update($data);

        return back()->with('success', 'Subject updated.');
    }

    public function destroy(FacultySubject $subject): RedirectResponse
    {
        abort_if($subject->user_id !== auth()->id(), 403);

        $subject->delete();

        return back()->with('success', 'Subject removed.');
    }
}
