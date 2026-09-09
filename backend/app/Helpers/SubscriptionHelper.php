<?php

namespace App\Helpers;

use App\Models\User;
use Carbon\Carbon;

class SubscriptionHelper
{
    /**
     * Возвращает [текст_кнопки, URL] для CTA-кнопки в боте
     * Возвращает null, если кнопку показывать не нужно
     * @return array{0: string, 1: string}|null
     */
    public static function ctaButton(User $user): ?array
    {
        $sub = $user->subscription;

        // Нет подписки или бесплатный тариф — не показываем кнопку
        if (!$sub || !$sub->plan || $sub->plan === 'free') {
            return null;
        }

        // Премиум активен и до окончания больше 14 дней — не показываем
        if ($sub->expires_at && Carbon::parse($sub->expires_at)->isFuture()) {
            $daysLeft = Carbon::now()->diffInDays(Carbon::parse($sub->expires_at), false);
            if ($daysLeft > 14) {
                return null;
            }
            $expires = Carbon::parse($sub->expires_at)->locale('ru')->isoFormat('D MMMM');
            return ["⏰ Продлить до {$expires}", 'https://my.neiro-astro.ru/pricing'];
        }

        // Подписка истекла
        return ["💳 Продлить подписку", 'https://my.neiro-astro.ru/pricing'];
    }
}
