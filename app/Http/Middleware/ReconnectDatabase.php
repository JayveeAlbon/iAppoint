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
        // On Render free tier, the database connection can be stale after a cold start
        // or long idle period. We probe the connection with a cheap query and reconnect
        // only if it has gone away — avoiding unnecessary purges on healthy connections.
        $connection = config('database.default'); // e.g. 'pgsql' or 'mysql'

        try {
            DB::connection($connection)->getPdo()->getAttribute(\PDO::ATTR_SERVER_VERSION);
        } catch (\Throwable $e) {
            // Connection is dead — purge the stale PDO object and open a fresh one
            try {
                DB::purge($connection);
                DB::reconnect($connection);
            } catch (\Throwable $reconnectError) {
                // If we still can't connect, let the request fail naturally with a
                // proper DB exception rather than hanging indefinitely.
            }
        }

        return $next($request);
    }
}
