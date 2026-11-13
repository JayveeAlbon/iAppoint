<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add initiated_by (which user created this appointment)
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('initiated_by')->nullable()->after('faculty_id')
                  ->comment('User ID who created this appointment (student or faculty)');
            $table->foreign('initiated_by')->references('id')->on('users')->nullOnDelete();
        });

        // 2. Extend the status enum to include 'invited' and 'declined'
        //    MySQL requires rebuilding the ENUM definition
        DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM(
            'pending','approved','rejected','completed','invited','declined'
        ) NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM(
            'pending','approved','rejected','completed'
        ) NOT NULL DEFAULT 'pending'");

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['initiated_by']);
            $table->dropColumn('initiated_by');
        });
    }
};
