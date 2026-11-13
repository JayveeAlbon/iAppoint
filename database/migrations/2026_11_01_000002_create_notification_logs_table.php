<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();

            // Related appointment (nullable — log survives appointment deletion)
            $table->unsignedBigInteger('appointment_id')->nullable();
            $table->foreign('appointment_id')->references('id')->on('appointments')->nullOnDelete();

            // Recipient (nullable — log survives user deletion)
            $table->unsignedBigInteger('recipient_user_id')->nullable();
            $table->foreign('recipient_user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('recipient_name');
            $table->string('recipient_email');

            // Email content
            $table->string('notification_type');   // e.g. 'appointment.requested', 'appointment.approved'
            $table->string('email_subject');
            $table->text('email_preview')->nullable(); // first ~500 chars, no credentials

            // Delivery
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();

            $table->timestamps();

            // Indexes for filtering
            $table->index('status');
            $table->index('notification_type');
            $table->index('created_at');
            $table->index('recipient_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};
