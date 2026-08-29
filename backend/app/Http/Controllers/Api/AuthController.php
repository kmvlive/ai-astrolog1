<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'birth_date' => ['nullable', 'date'],
            'birth_time' => ['nullable', 'date_format:H:i'],
            'birth_city' => ['nullable', 'string', 'max:255'],
            'horoscope_types' => ['nullable', 'array'],
            'horoscope_types.*' => ['string'],
            'frequency' => ['nullable', 'in:daily,weekly'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Создаём профиль с данными рождения
        $profileData = [
            'timezone' => 'Europe/Moscow',
        ];

        if ($request->filled('birth_date')) {
            $profileData['birth_date'] = $request->birth_date;
        }
        if ($request->filled('birth_time')) {
            $profileData['birth_time'] = $request->birth_time;
        }
        if ($request->filled('birth_city')) {
            $profileData['city'] = $request->birth_city;
            // Геокодинг координат через Nominatim (OpenStreetMap, бесплатно)
            $coords = $this->geocodeCity($request->birth_city);
            if ($coords) {
                $profileData['latitude'] = $coords['lat'];
                $profileData['longitude'] = $coords['lon'];
            }
        }

        $user->profile()->create($profileData);

        // Привязываем типы гороскопов
        if ($request->filled('horoscope_types')) {
            $typeIds = \App\Models\HoroscopeType::whereIn('slug', $request->horoscope_types)->pluck('id');
            $user->horoscopeTypes()->sync($typeIds);
        }

        // Создаём подписку с триалом 7 дней
        Subscription::create([
            'user_id' => $user->id,
            'status' => 'trial',
            'trial_ends_at' => now()->addDays(7),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('profile'),
            'token' => $token,
        ], 201);
    }

    /**
     * Login user.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('profile'),
            'token' => $token,
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->load(['profile', 'horoscopeTypes', 'channels', 'subscription']));
    }

    /**
     * Геокодинг города через Nominatim (OpenStreetMap).
     */
    private function geocodeCity(string $city): ?array
    {
        try {
            $url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' . urlencode($city);
            $response = file_get_contents($url, false, stream_context_create([
                'http' => [
                    'header' => "User-Agent: AI-Astrolog1/1.0\r\n",
                    'timeout' => 5,
                ],
            ]));

            if ($response === false) return null;

            $data = json_decode($response, true);
            if (!empty($data[0])) {
                return [
                    'lat' => (float) $data[0]['lat'],
                    'lon' => (float) $data[0]['lon'],
                ];
            }
        } catch (\Exception $e) {
            // Игнорируем ошибки геокодинга
        }

        return null;
    }
}
