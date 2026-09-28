<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['student', 'faculty', 'admin'])->default('student')->after('email');
            $table->string('student_id')->nullable()->unique()->after('role');
            $table->string('course')->nullable()->after('student_id');
            $table->string('year_level')->nullable()->after('course');
            $table->string('employee_id')->nullable()->unique()->after('year_level');
            $table->string('department')->nullable()->after('employee_id');
            $table->string('office_location')->nullable()->after('department');
            $table->decimal('latitude', 10, 8)->nullable()->after('office_location');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
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
