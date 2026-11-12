<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultySubject extends Model
{
    protected $fillable = ['user_id', 'name', 'description'];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
