<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['student', 'faculty', 'admin'])->default('student');
            $table->string('student_id')->nullable()->unique();
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->string('employee_id')->nullable()->unique();
            $table->string('department')->nullable();
            $table->string('office_location')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role', 'student_id', 'course', 'year_level',
                'employee_id', 'department', 'office_location',
                'latitude', 'longitude',
            ]);
        });
    }
};
