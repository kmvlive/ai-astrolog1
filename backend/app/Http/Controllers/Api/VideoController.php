<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VideoController extends Controller
{
    /**
     * Получить подписанный URL для видео
     * Токен живёт 10 минут, привязан к IP пользователя
     */
    public function getSignedUrl(Request $request, string $slug)
    {
        $validSlugs = ['koster']; // whitelist
        
        if (!in_array($slug, $validSlugs)) {
            return response()->json(['error' => 'Video not found'], 404);
        }
        
        $path = storage_path("app/public/video/{$slug}.mp4");
        if (!file_exists($path)) {
            return response()->json(['error' => 'Video file missing'], 404);
        }
        
        // Генерируем токен
        $expires = time() + 600; // 10 минут
        $ip = $request->ip();
        $userId = $request->user()?->id ?? 0;
        
        $payload = "{$slug}|{$expires}|{$ip}|{$userId}";
        $token = hash_hmac('sha256', $payload, config('app.key'));
        
        $url = "/api/video/{$slug}?token={$token}&expires={$expires}";
        
        Log::info('Video signed URL generated', [
            'slug' => $slug,
            'ip' => $ip,
            'user_id' => $userId,
            'expires' => date('Y-m-d H:i:s', $expires)
        ]);
        
        return response()->json([
            'url' => $url,
            'expires' => $expires
        ]);
    }
    
    /**
     * Отдача видео с проверкой токена
     */
    public function stream(Request $request, string $slug)
    {
        $validSlugs = ['koster'];
        
        if (!in_array($slug, $validSlugs)) {
            return response()->json(['error' => 'Video not found'], 404);
        }
        
        $token = $request->query('token');
        $expires = $request->query('expires');
        
        if (!$token || !$expires) {
            return response()->json(['error' => 'Missing token'], 401);
        }
        
        // Проверяем срок действия
        if (time() > $expires) {
            return response()->json(['error' => 'Token expired'], 401);
        }
        
        // Проверяем токен
        $ip = $request->ip();
        $userId = $request->user()?->id ?? 0;
        $payload = "{$slug}|{$expires}|{$ip}|{$userId}";
        $expectedToken = hash_hmac('sha256', $payload, config('app.key'));
        
        if (!hash_equals($expectedToken, $token)) {
            Log::warning('Video token mismatch', [
                'slug' => $slug,
                'ip' => $ip,
                'user_id' => $userId
            ]);
            return response()->json(['error' => 'Invalid token'], 403);
        }
        
        $path = storage_path("app/public/video/{$slug}.mp4");
        if (!file_exists($path)) {
            return response()->json(['error' => 'Video file missing'], 404);
        }
        
        // Отдаём файл с правильными заголовками для стриминга
        return response()->file($path, [
            'Content-Type' => 'video/mp4',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'private, max-age=0, no-cache',
        ]);
    }
}
