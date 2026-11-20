<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ReconnectDatabase
{
    public function handle(Request $request, Closure $next): Response
    {
        // Force a fresh DB connection check before every request.
        // This handles "MySQL server has gone away" on Render's free tier
        // where the MySQL connection drops after idle time.
        try {
            DB::connection()->select('SELECT 1');
        } catch (\Throwable $e) {
            DB::reconnect();
        }

        return $next($request);
    }
}
