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
        // Reconnect DB if connection was dropped (MySQL server has gone away)
        try {
            DB::reconnect();
        } catch (\Throwable $e) {
            // Ignore reconnect errors — let the request proceed and fail naturally
        }

        return $next($request);
    }
}
