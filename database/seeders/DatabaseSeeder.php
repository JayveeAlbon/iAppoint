<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@scc.edu'],
            [
                'name'     => 'Admin',
                'password' => Hash::make('password'),
                'role'     => 'admin',
                'status'   => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'faculty@scc.edu'],
            [
                'name'        => 'Sample Faculty',
                'password'    => Hash::make('password'),
                'role'        => 'faculty',
                'status'      => 'active',
                'employee_id' => 'FAC-001',
                'department'  => 'Computer Science',
            ]
        );

        User::firstOrCreate(
            ['email' => 'student@scc.edu'],
            [
                'name'       => 'Sample Student',
                'password'   => Hash::make('password'),
                'role'       => 'student',
                'status'     => 'active',
                'student_id' => 'STU-001',
                'course'     => 'BSIT',
                'year_level' => '1st Year',
            ]
        );
    }
}
