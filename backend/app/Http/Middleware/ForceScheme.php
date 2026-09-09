<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class ForceScheme
{
    public function handle(Request $request, Closure $next)
    {
        URL::forceScheme('https');
        return $next($request);
    }
}
