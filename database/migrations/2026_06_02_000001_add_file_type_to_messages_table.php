<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: drop old check constraint, alter type, add new check
            DB::statement("ALTER TABLE messages ALTER COLUMN type TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check");
            DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text','system','file'))");
        } else {
            // MySQL
            DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text','system','file') NOT NULL DEFAULT 'text'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("UPDATE messages SET type = 'text' WHERE type = 'file'");
            DB::statement("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check");
            DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text','system'))");
        } else {
            DB::statement("UPDATE messages SET type = 'text' WHERE type = 'file'");
            DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text','system') NOT NULL DEFAULT 'text'");
        }
    }
};
