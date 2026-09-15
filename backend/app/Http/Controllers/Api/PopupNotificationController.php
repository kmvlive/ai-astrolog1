<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PopupNotification;
use Illuminate\Http\Request;

class PopupNotificationController extends Controller
{
    /**
     * Получить активные popup для пользователя
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $dismissed = $user->popup_dismissed_ids ?? [];

        $popups = PopupNotification::active()
            ->ordered()
            ->get()
            ->filter(function ($popup) use ($dismissed) {
                // Если show_once и уже закрыт — пропускаем
                if ($popup->show_once && in_array($popup->id, $dismissed)) {
                    return false;
                }
                return true;
            })
            ->values();

        return response()->json(['popups' => $popups]);
    }

    /**
     * Отметить popup как закрытый
     */
    public function dismiss(Request $request, int $id)
    {
        $user = $request->user();
        $dismissed = $user->popup_dismissed_ids ?? [];

        if (!in_array($id, $dismissed)) {
            $dismissed[] = $id;
            // Храним последние 100
            $dismissed = array_slice($dismissed, -100);
            $user->update(['popup_dismissed_ids' => $dismissed]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Получить приветственный popup (для новых пользователей)
     */
    public function welcome(Request $request)
    {
        $user = $request->user();
        
        if ($user->welcome_popup_shown) {
            return response()->json(['show' => false]);
        }

        // Приветственный popup хранится в настройках или хардкодом
        return response()->json([
            'show' => true,
            'popup' => [
                'title' => config('popup.welcome_title', 'Добро пожаловать в AI Астролог! 🌟'),
                'body' => config('popup.welcome_body', "Здесь вы найдёте:\n\n🔮 Персональные гороскопы по натальной карте\n🌙 Лунные календари на каждый день\n🃏 Гадания на Таро и рунах\n💫 Ежедневные аффирмации\n\nИсследуйте все возможности — звёзды ждут вас!"),
                'icon' => config('popup.welcome_icon', '✨'),
                'link_url' => config('popup.welcome_link_url') ?: null,
                'link_text' => config('popup.welcome_link_text') ?: null,
                'dismiss_text' => config('popup.welcome_dismiss_text') ?: null,
                'type' => 'horoscope',
            ],
        ]);
    }

    /**
     * Отметить приветственный popup как показанный
     */
    public function dismissWelcome(Request $request)
    {
        $request->user()->update(['welcome_popup_shown' => true]);
        return response()->json(['ok' => true]);
    }
}
