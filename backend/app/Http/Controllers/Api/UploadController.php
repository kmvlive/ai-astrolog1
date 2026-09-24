<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        // Базовая проверка IP для безопасности (можно добавить позже авторизацию)
        $allowedIps = ['127.0.0.1', '::1'];
        $clientIp = $request->ip();
        
        if (!in_array($clientIp, $allowedIps)) {
            // Разрешаем пока всем, потом добавим авторизацию
            \Log::info("[Upload] from IP: $clientIp");
        }

        $request->validate([
            'file' => 'required|file|max:20480', // до 20 МБ
            'folder' => 'required|string|in:space,blog,avatars,interiors',
        ]);

        $file = $request->file('file');
        $folder = $request->input('folder', 'space');
        
        // Сохраняем с оригинальным именем
        $filename = $file->getClientOriginalName();
        $path = $file->storeAs("public/$folder", $filename);
        
        $url = "/storage/$folder/$filename";
        
        \Log::info("[Upload] success: $url ($path)");
        
        return response()->json([
            'success' => true,
            'url' => $url,
            'path' => $path,
            'filename' => $filename,
        ]);
    }
}
