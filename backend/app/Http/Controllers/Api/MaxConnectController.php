<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaxSubscriber;
use Illuminate\Http\Request;

class MaxConnectController extends Controller
{
    /**
     * Получить ссылку на бота и статус подключения
     */
    public function link(Request $request)
    {
        $user = $request->user();
        $sub = MaxSubscriber::where('user_id_fk', $user->id)->first();

        return response()->json([
            'url' => 'https://max.ru/id263211995820_bot',
            'connected' => $sub && $sub->is_active,
            'name' => $sub?->first_name,
        ]);
    }

    /**
     * Подтвердить подключение MAX (по user_id из бота)
     */
    public function confirm(Request $request, int $maxUserId)
    {
        $user = $request->user();

        $sub = MaxSubscriber::where('user_id', $maxUserId)->first();
        if (!$sub) {
            return response()->json(['error' => 'Подписчик не найден. Напишите /start боту в MAX.'], 404);
        }

        $sub->user_id_fk = $user->id;
        $sub->is_active = true;
        $sub->save();

        // Отправляем приветствие
        $max = app(\App\Services\MaxService::class);
        $max->sendMessage($maxUserId, "✅ Аккаунт на my.neiro-astro.ru привязан!\n\nТеперь вы будете получать персональные гороскопы в MAX.");

        return response()->json(['success' => true]);
    }
}
