<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    protected $fillable = [
        'student_id',
        'faculty_id',
        'initiated_by',
        'title',
        'message',
        'requested_at',
        'status',
        'admin_notes',
        'approved_at',
        'reminder_24h_sent_at',
        'reminder_1h_sent_at',
    ];

    protected $casts = [
        'requested_at'         => 'datetime',
        'approved_at'          => 'datetime',
        'reminder_24h_sent_at' => 'datetime',
        'reminder_1h_sent_at'  => 'datetime',
    ];

    // Status helpers
    public function isInvited(): bool   { return $this->status === 'invited'; }
    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isApproved(): bool  { return $this->status === 'approved'; }
    public function isDeclined(): bool  { return $this->status === 'declined'; }
    public function isFacultyInitiated(): bool { return $this->initiated_by === $this->faculty_id; }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    public function feedback(): HasOne
    {
        return $this->hasOne(AppointmentFeedback::class);
    }
}
