<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Horoscope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class HoroscopeController extends Controller
{
    /**
     * Генерирует гороскоп для текущего пользователя
     */
    public function generate(Request $request)
    {
        $request->validate([
            'type' => ['nullable', 'in:general,love,career,financial,health,chinese,tibetan'],
        ]);

        $user = $request->user()->load('profile');
        $profile = $user->profile;

        if (!$profile || !$profile->birth_date) {
            return response()->json([
                'error' => 'Необходимо заполнить дату рождения в профиле'
            ], 400);
        }

        if (!$profile->latitude || !$profile->longitude) {
            return response()->json([
                'error' => 'Необходимо указать город рождения для расчёта карты'
            ], 400);
        }

        // Проверяем, есть ли свежий гороскоп сегодня
        $today = now()->startOfDay();
        $type = $request->input('type', 'general');
        $existing = Horoscope::where('user_id', $user->id)
            ->where('type', $type)
            ->where('created_at', '>=', $today)
            ->first();

        if ($existing) {
            return response()->json([
                'horoscope' => $existing,
                'cached' => true,
            ]);
        }

        // Форматируем дату и время как строки
        $birthDate = $profile->birth_date;
        if ($birthDate instanceof \DateTimeInterface) {
            $birthDate = $birthDate->format('Y-m-d');
        } elseif (is_string($birthDate) && strlen($birthDate) > 10) {
            // Если это datetime строка "1990-05-15T00:00:00.000000Z"
            $birthDate = substr($birthDate, 0, 10);
        }

        $birthTime = $profile->birth_time ?? '12:00';
        if ($birthTime instanceof \DateTimeInterface) {
            $birthTime = $birthTime->format('H:i');
        } elseif (is_string($birthTime) && strlen($birthTime) > 5) {
            // Если это time строка "14:30:00"
            $birthTime = substr($birthTime, 0, 5);
        }

        // Запрос к Python-сервису
        try {
            $response = Http::timeout(30)->post('http://astro-neiro-python:8000/natal-chart', [
                'name' => $user->name,
                'birth_date' => $birthDate,
                'birth_time' => $birthTime,
                'birth_city' => $profile->city ?? 'Москва',
                'latitude' => (float) $profile->latitude,
                'longitude' => (float) $profile->longitude,
                'timezone' => $profile->timezone ?? 'Europe/Moscow',
            ]);

            if (!$response->successful()) {
                \Log::error('Python service error', ['response' => $response->body()]);
                return response()->json([
                    'error' => 'Ошибка расчёта натальной карты'
                ], 500);
            }

            $natal = $response->json();
        } catch (\Exception $e) {
            \Log::error('Python service exception', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Не удалось связаться с астрологическим сервисом: ' . $e->getMessage()
            ], 500);
        }

        // Генерация текста: сначала ИИ (Timeweb), при ошибке — шаблон
        $aiText = app(\App\Services\AiService::class)->generateHoroscope($natal, $type, $user->name);
        $content = $aiText ?? $this->generateHoroscopeText($natal, $type, $user->name);

        // Сохраняем
        $horoscope = Horoscope::create([
            'user_id' => $user->id,
            'type' => $type,
            'content' => $content,
            'natal_data' => $natal,
        ]);

        return response()->json([
            'horoscope' => $horoscope,
            'cached' => false,
        ], 201);
    }

    /**
     * Список последних гороскопов пользователя
     */
    public function index(Request $request)
    {
        $horoscopes = $request->user()
            ->horoscopes()
            ->latest()
            ->limit(20)
            ->get();

        return response()->json(['horoscopes' => $horoscopes]);
    }

    /**
     * Генерация текста гороскопа на основе натальной карты
     */
    private function generateHoroscopeText(array $natal, string $type, string $name): string
    {
        $sun = $natal['sun_sign'] ?? 'Unknown';
        $moon = $natal['moon_sign'] ?? 'Unknown';
        $asc = $natal['ascendant'] ?? 'Unknown';

        $signsRu = [
            'Ari' => 'Овене', 'Tau' => 'Тельце', 'Gem' => 'Близнецах',
            'Can' => 'Раке', 'Leo' => 'Льве', 'Vir' => 'Деве',
            'Lib' => 'Весах', 'Sco' => 'Скорпионе', 'Sag' => 'Стрельце',
            'Cap' => 'Козероге', 'Aqu' => 'Водолее', 'Pis' => 'Рыбах',
        ];

        $sunRu = $signsRu[$sun] ?? $sun;
        $moonRu = $signsRu[$moon] ?? $moon;
        $ascRu = $signsRu[$asc] ?? $asc;

        $today = now()->locale('ru')->isoFormat('D MMMM YYYY');

        $intro = "{$name}, ваш индивидуальный гороскоп на {$today}.\n\n";
        $astro = "Ваше Солнце в {$sunRu}, Луна в {$moonRu}, асцендент в {$ascRu}.\n\n";

        switch ($type) {
            case 'love':
                $body = "Сегодня звёзды благоволят романтическим встречам. Ваша интуиция, усиленная лунной позицией, подскажет правильные решения в отношениях. "
                      . "Избегайте спонтанных решений в вечернее время — Меркурий может искажать информацию.";
                break;
            case 'career':
                $body = "Рабочий день принесёт возможности для профессионального роста. Ваша природная дисциплина (усиленная асцендентом) поможет завершить важные проекты. "
                      . "Встречи после обеда будут особенно продуктивными.";
                break;
            case 'financial':
                $body = "Финансовая удача сопутствует вам сегодня. Доверьтесь интуиции в вопросах инвестиций. "
                      . "Избегайте крупных покупок в первой половине дня — возможны неожиданные расходы.";
                break;
            case 'health':
                $body = "Обратите внимание на режим сна и питание. Энергия Солнца поддерживает вашу физическую форму, "
                      . "но Луна советует уделить время медитации и отдыху во второй половине дня.";
                break;
            default: // general
                $body = "Сегодня день приносит гармоничное сочетание возможностей и испытаний. Доверяйте интуиции — она особенно сильна. "
                      . "В первой половине дня благоприятны активные действия, во второй — размышления и планирование. "
                      . "Вечером возможны важные встречи или известия.";
                break;
        }

        return $intro . $astro . $body;
    }
}
