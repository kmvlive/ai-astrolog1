<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Обновляет профиль пользователя (данные рождения)
     */
    public function update(Request $request)
    {
        $request->validate([
            'birth_date' => ['required', 'date'],
            'birth_time' => ['required', 'date_format:H:i'],
            'birth_city' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $profile = $user->profile ?? $user->profile()->create(['timezone' => 'Europe/Moscow']);

        $profileData = [
            'birth_date' => $request->birth_date,
            'birth_time' => $request->birth_time,
            'city' => $request->birth_city,
        ];

        // Геокодинг координат
        $coords = $this->geocodeCity($request->birth_city);
        if ($coords) {
            $profileData['latitude'] = $coords['lat'];
            $profileData['longitude'] = $coords['lon'];
        } else {
            return response()->json([
                'error' => 'Не удалось найти город. Попробуйте указать более точно (например, "Москва, Россия")'
            ], 400);
        }

        $profile->update($profileData);

        return response()->json([
            'message' => 'Профиль обновлён',
            'user' => $user->fresh()->load('profile'),
        ]);
    }

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
            // Игнорируем ошибки
        }

        return null;
    }
}
