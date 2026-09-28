<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyStatus extends Model
{
    protected $fillable = ['user_id', 'status', 'catering_count'];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function isBusy(): bool
    {
        return $this->status === 'busy';
    }
}
