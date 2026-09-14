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
}
