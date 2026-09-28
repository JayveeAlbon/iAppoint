<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isFaculty() || $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'title'            => 'required|string|max:200',
            'scheduled_at'     => 'required|date|after:now',
            'duration_minutes' => 'integer|min:5|max:480',
            'participants'     => 'required|array|min:1',
            'participants.*'   => [
                'integer',
                Rule::exists('users', 'id')->where(fn($q) => $q->where('role', '!=', 'admin')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'participants.*.exists' => 'One or more selected participants are invalid. Administrators cannot be invited to meetings.',
        ];
    }
}
