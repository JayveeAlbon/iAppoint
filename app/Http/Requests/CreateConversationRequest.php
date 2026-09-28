<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'           => 'required|in:private,group',
            'name'           => 'required_if:type,group|nullable|string|max:100',
            'recipient_id'   => 'required_if:type,private|nullable|integer|exists:users,id',
            'participants'   => 'required_if:type,group|nullable|array|min:1',
            'participants.*' => 'integer|exists:users,id',
        ];
    }
}
