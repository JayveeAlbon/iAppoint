<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text','system','file') NOT NULL DEFAULT 'text'");
    }

    public function down(): void
    {
        DB::statement("UPDATE messages SET type = 'text' WHERE type = 'file'");
        DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text','system') NOT NULL DEFAULT 'text'");
    }
};
