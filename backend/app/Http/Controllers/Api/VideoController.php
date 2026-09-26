<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoController extends Controller
{
    /**
     * Получить signed URL для MP4 видео
     */
    public function getSignedUrl(Request $request, string $slug)
    {
        $validSlugs = ['koster'];
        
        if (!in_array($slug, $validSlugs)) {
            return response()->json(['error' => 'Video not found'], 404);
        }
        
        $path = storage_path("app/public/video/{$slug}.mp4");
        if (!file_exists($path)) {
            return response()->json(['error' => 'Video file missing'], 404);
        }
        
        $expires = time() + 600;
        $ip = $request->ip();
        $userId = $request->user()?->id ?? 0;
        
        $payload = "{$slug}|{$expires}|{$ip}|{$userId}";
        $token = hash_hmac('sha256', $payload, config('app.key'));
        
        $url = "/api/video/{$slug}?token={$token}&expires={$expires}";
        
        return response()->json([
            'url' => $url,
            'expires' => $expires
        ]);
    }
    
    /**
     * Получить signed URL для HLS (master.m3u8)
     */
    public function getHlsUrl(Request $request, string $slug)
    {
        $validSlugs = ['koster'];
        
        if (!in_array($slug, $validSlugs)) {
            return response()->json(['error' => 'Video not found'], 404);
        }
        
        $hlsPath = storage_path("app/public/video/{$slug}_hls/master.m3u8");
        if (!file_exists($hlsPath)) {
            return response()->json(['error' => 'HLS not available'], 404);
        }
        
        $expires = time() + 600;
        $ip = $request->ip();
        $userId = $request->user()?->id ?? 0;
        
        $payload = "{$slug}|hls|{$expires}|{$ip}|{$userId}";
        $token = hash_hmac('sha256', $payload, config('app.key'));
        
        // Возвращаем путь к HLS папке + токен
        $url = "/storage/video/{$slug}_hls/master.m3u8?token={$token}&expires={$expires}";
        
        return response()->json([
            'url' => $url,
            'expires' => $expires,
            'mode' => 'hls'
        ]);
    }
    
    /**
     * Отдача MP4 с HTTP Range support
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
        
        if (time() > $expires) {
            return response()->json(['error' => 'Token expired'], 401);
        }
        
        $ip = $request->ip();
        $userId = $request->user()?->id ?? 0;
        $payload = "{$slug}|{$expires}|{$ip}|{$userId}";
        $expectedToken = hash_hmac('sha256', $payload, config('app.key'));
        
        if (!hash_equals($expectedToken, $token)) {
            return response()->json(['error' => 'Invalid token'], 403);
        }
        
        $path = storage_path("app/public/video/{$slug}.mp4");
        if (!file_exists($path)) {
            return response()->json(['error' => 'Video file missing'], 404);
        }
        
        $fileSize = filesize($path);
        $file = fopen($path, 'rb');
        
        if (!$file) {
            return response()->json(['error' => 'Cannot open file'], 500);
        }
        
        $range = $request->header('Range');
        $start = 0;
        $end = $fileSize - 1;
        $statusCode = 200;
        
        if ($range && preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
            $start = intval($matches[1]);
            $end = isset($matches[2]) && $matches[2] !== '' ? intval($matches[2]) : $fileSize - 1;
            
            if ($start > $end || $start >= $fileSize) {
                fclose($file);
                return response('', 416)
                    ->header('Content-Range', "bytes */{$fileSize}");
            }
            
            $statusCode = 206;
            fseek($file, $start);
        }
        
        $length = $end - $start + 1;
        
        $response = new StreamedResponse(function() use ($file, $length) {
            $bufferSize = 8192;
            $remaining = $length;
            
            while ($remaining > 0 && !feof($file)) {
                $readSize = min($bufferSize, $remaining);
                echo fread($file, $readSize);
                $remaining -= $readSize;
                flush();
            }
            
            fclose($file);
        }, $statusCode);
        
        $response->headers->set('Content-Type', 'video/mp4');
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->headers->set('Content-Length', $length);
        $response->headers->set('Cache-Control', 'private, max-age=0, no-cache');
        
        if ($statusCode === 206) {
            $response->headers->set('Content-Range', "bytes {$start}-{$end}/{$fileSize}");
        }
        
        return $response;
    }
    
    /**
     * Middleware для проверки HLS токена
     */
    public function validateHlsToken(Request $request)
    {
        $token = $request->query('token');
        $expires = $request->query('expires');
        
        if (!$token || !$expires) {
            return false;
        }
        
        if (time() > $expires) {
            return false;
        }
        
        // Извлекаем slug из пути
        $path = $request->path();
        if (preg_match('/video\/([^\/]+)_hls\//', $path, $matches)) {
            $slug = $matches[1];
            $ip = $request->ip();
            $userId = $request->user()?->id ?? 0;
            $payload = "{$slug}|hls|{$expires}|{$ip}|{$userId}";
            $expectedToken = hash_hmac('sha256', $payload, config('app.key'));
            
            return hash_equals($expectedToken, $token);
        }
        
        return false;
    }
}
