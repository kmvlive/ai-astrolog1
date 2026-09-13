<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affirmation;
use Illuminate\Http\Request;

class AffirmationController extends Controller
{
    public function today()
    {
        $today = now()->startOfDay();
        $affirmation = Affirmation::whereDate('date', $today)->first();

        if (!$affirmation) {
            // Генерируем через artisan команду (безопаснее чем прямой handle)
            try {
                \Illuminate\Support\Facades\Artisan::call('affirmation:generate-daily');
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Affirmation generate failed', ['error' => $e->getMessage()]);
            }
            $affirmation = Affirmation::whereDate('date', $today)->first();
        }

        return response()->json($affirmation);
    }

    public function calendar(Request $request)
    {
        $days = (int) $request->input('days', 30);
        $affirmations = Affirmation::where('date', '>=', now()->subDays(7)->startOfDay())
            ->where('date', '<=', now()->addDays($days)->endOfDay())
            ->orderBy('date')
            ->get();

        return response()->json($affirmations);
    }

    public function subscribe(Request $request)
    {
        // Подписка только для авторизованных (email берём из профиля)
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        $user->update(['email_opt_in' => true]);

        // Помечаем что пользователь хочет аффирмации (через отдельный флаг)
        \Illuminate\Support\Facades\Cache::forever('affirmation_sub_' . $user->id, true);

        return response()->json(['success' => true, 'email' => $user->email]);
    }

    public function subscriptionStatus(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['subscribed' => false]);
        }
        $subscribed = (bool) \Illuminate\Support\Facades\Cache::get('affirmation_sub_' . $user->id, false);
        return response()->json(['subscribed' => $subscribed, 'email' => $user->email]);
    }
}
