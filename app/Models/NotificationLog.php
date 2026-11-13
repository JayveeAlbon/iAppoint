<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationLog extends Model
{
    protected $fillable = [
        'appointment_id',
        'recipient_user_id',
        'recipient_name',
        'recipient_email',
        'notification_type',
        'email_subject',
        'email_preview',
        'status',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    // Human-readable labels for each notification type
    public const TYPE_LABELS = [
        'appointment.requested'          => 'New Appointment Request',
        'appointment.requested.faculty'  => 'New Appointment Request',
        'appointment.approved.student'   => 'Appointment Approved',
        'appointment.approved.faculty'   => 'Appointment Approved',
        'appointment.rejected.admin'     => 'Appointment Rejected',
        'appointment.rejected.faculty'   => 'Appointment Rejected',
        'appointment.rescheduled'        => 'Appointment Rescheduled',
        'appointment.rescheduled.faculty'=> 'Appointment Rescheduled',
        'appointment.cancelled.faculty'  => 'Appointment Cancelled',
        'appointment.cancelled.admin'    => 'Appointment Cancelled',
    ];

    public function getLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->notification_type] ?? ucwords(str_replace(['.', '_'], ' ', $this->notification_type));
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class)->withTrashed();
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}
