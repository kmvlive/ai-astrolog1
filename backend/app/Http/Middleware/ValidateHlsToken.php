<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateHlsToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->query('token');
        $expires = $request->query('expires');
        
        if (!$token || !$expires) {
            return response()->json(['error' => 'Missing token'], 401);
        }
        
        if (time() > $expires) {
            return response()->json(['error' => 'Token expired'], 401);
        }
        
        $path = $request->path();
        if (preg_match('/video\/([^\/]+)_hls\//', $path, $matches)) {
            $slug = $matches[1];
            $ip = $request->ip();
            $userId = $request->user()?->id ?? 0;
            $payload = "{$slug}|hls|{$expires}|{$ip}|{$userId}";
            $expectedToken = hash_hmac('sha256', $payload, config('app.key'));
            
            if (hash_equals($expectedToken, $token)) {
                return $next($request);
            }
        }
        
        return response()->json(['error' => 'Invalid token'], 403);
    }
}
