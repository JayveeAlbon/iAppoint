<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartCateringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isFaculty();
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|integer|exists:users,id',
        ];
    }
}
