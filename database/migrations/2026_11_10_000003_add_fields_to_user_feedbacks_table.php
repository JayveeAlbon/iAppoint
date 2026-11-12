<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_feedbacks', function (Blueprint $table) {
            if (!Schema::hasColumn('user_feedbacks', 'feedback_tab')) {
                $table->string('feedback_tab', 20)->default('system')->after('category');
            }
            if (!Schema::hasColumn('user_feedbacks', 'priority')) {
                $table->string('priority', 20)->default('medium')->after('feedback_tab');
            }
            if (!Schema::hasColumn('user_feedbacks', 'suggestions')) {
                $table->text('suggestions')->nullable()->after('message');
            }
            if (!Schema::hasColumn('user_feedbacks', 'document_path')) {
                $table->string('document_path', 500)->nullable()->after('screenshot_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_feedbacks', function (Blueprint $table) {
            $table->dropColumn(['feedback_tab', 'priority', 'suggestions', 'document_path']);
        });
    }
};
