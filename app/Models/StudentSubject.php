<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSubject extends Model
{
    protected $fillable = ['user_id', 'subject_code', 'subject_name', 'instructor'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
