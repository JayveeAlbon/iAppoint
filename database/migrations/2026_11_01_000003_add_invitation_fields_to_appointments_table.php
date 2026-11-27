<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add initiated_by (which user created this appointment)
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('initiated_by')->nullable()
                  ->comment('User ID who created this appointment (student or faculty)');
            $table->foreign('initiated_by')->references('id')->on('users')->nullOnDelete();
        });

        // 2. Extend the status column to include 'invited' and 'declined'
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: change to VARCHAR and update the check constraint
            DB::statement("ALTER TABLE appointments ALTER COLUMN status TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
            DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
                CHECK (status IN ('pending','approved','rejected','completed','invited','declined'))");
        } else {
            // MySQL / MariaDB
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM(
                'pending','approved','rejected','completed','invited','declined'
            ) NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("UPDATE appointments SET status = 'approved' WHERE status IN ('invited','declined')");
            DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
            DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
                CHECK (status IN ('pending','approved','rejected','completed'))");
        } else {
            DB::statement("UPDATE appointments SET status = 'approved' WHERE status IN ('invited','declined')");
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM(
                'pending','approved','rejected','completed'
            ) NOT NULL DEFAULT 'pending'");
        }

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['initiated_by']);
            $table->dropColumn('initiated_by');
        });
    }
};
