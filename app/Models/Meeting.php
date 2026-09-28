<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meeting extends Model
{
    protected $fillable = [
        'created_by', 'title', 'scheduled_at', 'duration_minutes',
        'status', 'room_code',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'meeting_participants')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function cateringSessions(): HasMany
    {
        return $this->hasMany(CateringSession::class);
    }

    public function isOngoing(): bool
    {
        return $this->status === 'ongoing';
    }

    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }
}
