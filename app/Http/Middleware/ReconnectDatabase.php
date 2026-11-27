<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ReconnectDatabase
{
    public function handle(Request $request, Closure $next): Response
    {
        // Purge and reconnect to get a fresh PDO connection every request.
        // On Render free tier, MySQL connections go stale during cold starts.
        // DB::purge() destroys the stale PDO object; DB::reconnect() opens a new one.
        try {
            DB::purge();
            DB::reconnect();
        } catch (\Throwable $e) {
            // If reconnect fails here, the request will fail with a proper DB error
            // rather than hanging indefinitely.
        }

        return $next($request);
    }
}
