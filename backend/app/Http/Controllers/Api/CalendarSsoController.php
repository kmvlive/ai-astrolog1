<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * SSO для календаря — одноразовые токены через Redis
 * 
 * Flow:
 * 1. POST /api/calendar/sso/issue (требует auth:sanctum)
 *    → создаёт одноразовый код на 5 минут
 * 2. Redirect на calendar.neiro-astro.ru/auth/sso?code=XXX
 * 3. POST /api/calendar/sso/exchange (публичный)
 *    → обменивает код на данные пользователя
 */
class CalendarSsoController extends Controller
{
    /**
     * Создать одноразовый код для SSO (вызывается с основного сайта)
     */
    public function issue(Request $request)
    {
        $user = $request->user();
        
        // Генерируем одноразовый код (32 символа, URL-safe)
        $code = Str::random(32);
        
        // Сохраняем в Redis на 5 минут
        Cache::store('redis')->put(
            "calendar_sso:{$code}",
            [
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'calendar_pro_enabled' => (bool) $user->calendar_pro_enabled,
                'created_at' => now()->toISOString(),
            ],
            300 // 5 минут TTL
        );
        
        Log::info('Calendar SSO code issued', [
            'user_id' => $user->id,
            'code_prefix' => substr($code, 0, 8) . '...',
        ]);
        
        return response()->json([
            'success' => true,
            'code' => $code,
            'redirect_url' => "https://calendar.neiro-astro.ru/auth/sso?code={$code}",
            'expires_in' => 300,
        ]);
    }
    
    /**
     * Обменять одноразовый код на данные пользователя (вызывается из календаря)
     */
    public function exchange(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:32',
        ]);
        
        $code = $request->input('code');
        $cacheKey = "calendar_sso:{$code}";
        
        // Получаем данные из Redis и СРАЗУ УДАЛЯЕМ (одноразовый!)
        $data = Cache::store('redis')->pull($cacheKey);
        
        if (!$data) {
            Log::warning('Calendar SSO code invalid or expired', [
                'code_prefix' => substr($code, 0, 8) . '...',
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Недействительный или просроченный код',
            ], 400);
        }
        
        // Создаём Sanctum token для календаря
        $user = \App\Models\User::find($data['user_id']);
        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Пользователь не найден',
            ], 404);
        }
        
        $token = $user->createToken('calendar-sso')->plainTextToken;
        
        Log::info('Calendar SSO code exchanged', [
            'user_id' => $user->id,
            'code_prefix' => substr($code, 0, 8) . '...',
        ]);
        
        return response()->json([
            'success' => true,
            'user' => $data,
            'token' => $token,
        ]);
    }
}
