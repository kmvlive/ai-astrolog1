<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RedirectAdminHome
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->getMethod() === 'GET' && $request->path() === 'admin') {
            return redirect('/admin/analytics');
        }
        return $next($request);
    }
}
