<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'role',
        'status',
        'avatar',
        'student_id',
        'course',
        'year_level',
        'employee_id',
        'department',
        'office_location',
        'latitude',
        'longitude',
        'location_consent_at',
    ];

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        // Legacy rows saved under the (broken) storage symlink still have paths
        // like "avatars/xyz.jpg" — the same shape we now use directly in public/.
        $path = ltrim($this->avatar, '/');

        return asset($path);
    }

    protected $appends = ['avatar_url'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'   => 'datetime',
            'location_consent_at' => 'datetime',
            'password'            => 'hashed',
        ];
    }

    // ── Existing ──────────────────────────────────────────────────────────────

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    // ── Friends ───────────────────────────────────────────────────────────────

    public function sentFriendRequests(): HasMany
    {
        return $this->hasMany(Friendship::class, 'requester_id');
    }

    public function receivedFriendRequests(): HasMany
    {
        return $this->hasMany(Friendship::class, 'addressee_id');
    }

    // ── Messaging ─────────────────────────────────────────────────────────────

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot('joined_at', 'last_read_at')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    // ── Meetings ──────────────────────────────────────────────────────────────

    public function createdMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'created_by');
    }

    public function meetings(): BelongsToMany
    {
        return $this->belongsToMany(Meeting::class, 'meeting_participants')
            ->withPivot('status')
            ->withTimestamps();
    }

    // ── Faculty status ────────────────────────────────────────────────────────

    public function facultyStatus(): HasOne
    {
        return $this->hasOne(FacultyStatus::class);
    }

    public function cateringSessions(): HasMany
    {
        return $this->hasMany(CateringSession::class, 'faculty_id');
    }

    public function cateringSessionsAsStudent(): HasMany
    {
        return $this->hasMany(CateringSession::class, 'student_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isFaculty(): bool { return $this->role === 'faculty'; }
    public function isStudent(): bool  { return $this->role === 'student'; }
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isPending(): bool  { return $this->status === 'pending'; }

    public function initials(): string
    {
        return collect(explode(' ', $this->name))
            ->map(fn($n) => strtoupper($n[0]))
            ->take(2)
            ->implode('');
    }
}
