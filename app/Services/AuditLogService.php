<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogService
{
    public function log(
        string  $event,
        ?Model  $subject    = null,
        array   $properties = [],
        ?User   $causer     = null,
    ): void {
        AuditLog::create([
            'causer_id'    => ($causer ?? auth()->user())?->id,
            'event'        => $event,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id'   => $subject?->id,
            'properties'   => $properties ?: null,
            'ip'           => request()->ip(),
        ]);
    }
}
