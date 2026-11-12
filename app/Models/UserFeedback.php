<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserFeedback extends Model
{
    protected $table = 'user_feedbacks';

    protected $fillable = [
        'user_id',
        'feedback_tab',
        'category',
        'priority',
        'subject',
        'message',
        'suggestions',
        'page_url',
        'screenshot_path',
        'document_path',
        'status',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    protected $appends = ['screenshot_url', 'document_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getScreenshotUrlAttribute(): ?string
    {
        return $this->screenshot_path ? asset(ltrim($this->screenshot_path, '/')) : null;
    }

    public function getDocumentUrlAttribute(): ?string
    {
        return $this->document_path ? asset(ltrim($this->document_path, '/')) : null;
    }
}
