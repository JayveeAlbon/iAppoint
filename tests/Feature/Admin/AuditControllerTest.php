<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\Admin\AuditController;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuditControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('causer_id')->nullable();
            $table->string('event');
            $table->timestamps();
        });
    }

    public function test_admin_audit_page_groups_events_by_prefix(): void
    {
        AuditLog::create(['event' => 'user.created']);
        AuditLog::create(['event' => 'user.updated']);
        AuditLog::create(['event' => 'appointment.approved']);

        $request = Request::create('/admin/audit');
        $request->headers->set('X-Inertia', 'true');
        $this->app->instance('request', $request);
        $admin = new User(['role' => 'admin']);
        $request->setUserResolver(fn () => $admin);

        $response = app(AuditController::class)->index($request)->toResponse($request);

        $this->assertSame(
            ['appointment', 'user'],
            $response->getData(true)['props']['eventGroups'],
        );
    }
}
