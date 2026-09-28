<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserFeedback extends Model
{
    protected $table = 'user_feedbacks';

    protected $fillable = [
        'user_id',
        'category',
        'subject',
        'message',
        'page_url',
        'screenshot_path',
        'status',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    protected $appends = ['screenshot_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getScreenshotUrlAttribute(): ?string
    {
        return $this->screenshot_path ? asset(ltrim($this->screenshot_path, '/')) : null;
    }
}
