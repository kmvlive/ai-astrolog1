<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Аутентификация специально для сервиса календарей.
 * Изолирован от основного /api/login:
 * - Не отправляет verification email
 * - Не зависит от email_verified_at
 * - Сразу возвращает calendar_pro_enabled
 */
class CalendarAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Неверный email или пароль'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('calendar-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'calendar_pro_enabled' => (bool) $user->calendar_pro_enabled,
                'created_at' => $user->created_at?->toISOString(),
            ],
            'token' => $token,
        ]);
    }
}
