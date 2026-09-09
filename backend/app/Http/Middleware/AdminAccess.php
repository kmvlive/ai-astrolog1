<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        $check = auth()->check();
        $isAdmin = $user ? (bool)$user->is_admin : null;

        Log::info('AdminAccess check', [
            'session_driver' => config('session.driver'),
            'auth_check' => $check,
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'is_admin_field' => $isAdmin,
            'is_admin_raw' => $user ? $user->getAttributes()['is_admin'] ?? 'missing' : 'no user',
        ]);

        if (!$check || !$isAdmin) {
            Log::warning('AdminAccess DENIED', ['user' => $user?->email]);
            abort(403, 'Доступ только для администраторов');
        }

        return $next($request);
    }
}
