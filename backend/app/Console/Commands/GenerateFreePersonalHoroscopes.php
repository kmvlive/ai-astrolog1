<?php

namespace App\Console\Commands;

use App\Models\Horoscope;
use App\Models\User;
use App\Services\AiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateFreePersonalHoroscopes extends Command
{
    protected $signature = 'horoscope:generate-personal-free {--force : перегенерировать существующие}';
    protected $description = 'Ночная генерация бесплатных персональных гороскопов (5:00)';

    public function handle(AiService $ai): int
    {
        // Защита от параллельного запуска (race condition)
        if (!cache()->add('horoscope_generate_personal_lock', true, now()->addMinutes(60))) {
            $this->error("⚠ Команда уже запущена другим процессом");
            return self::FAILURE;
        }

        $today = now()->startOfDay();
        
        $users = User::where('free_personal_enabled', true)
            ->whereNotNull('email_verified_at')
            ->whereHas('profile', function ($q) {
                $q->whereNotNull('birth_date')
                  ->whereNotNull('latitude')
                  ->whereNotNull('longitude');
            })
            ->with('profile')
            ->get();

        $this->info("Пользователей с галочкой: {$users->count()}");

        $generated = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($users as $user) {
            $profile = $user->profile;
            
            // Проверяем, есть ли уже сегодня
            $existing = Horoscope::where('user_id', $user->id)
                ->where('type', 'general')
                ->where('is_personal', true)
                ->where('created_at', '>=', $today)
                ->first();

            if ($existing && !$this->option('force')) {
                $skipped++;
                continue;
            }

            // Форматируем дату и время
            $birthDate = $profile->birth_date;
            if ($birthDate instanceof \DateTimeInterface) {
                $birthDate = $birthDate->format('Y-m-d');
            } elseif (is_string($birthDate) && strlen($birthDate) > 10) {
                $birthDate = substr($birthDate, 0, 10);
            }

            $birthTime = $profile->birth_time ?? '12:00';
            if ($birthTime instanceof \DateTimeInterface) {
                $birthTime = $birthTime->format('H:i');
            } elseif (is_string($birthTime) && strlen($birthTime) > 5) {
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
                    $this->error("✗ {$user->email}: Python service error");
                    Log::error('Python service error', ['user' => $user->id, 'response' => $response->body()]);
                    $failed++;
                    continue;
                }

                $natal = $response->json();
            } catch (\Exception $e) {
                $this->error("✗ {$user->email}: {$e->getMessage()}");
                Log::error('Python service exception', ['user' => $user->id, 'error' => $e->getMessage()]);
                $failed++;
                continue;
            }

            // Генерация текста
            $content = $ai->generateHoroscope($natal, 'general', $user->name);
            
            if (!$content) {
                $this->error("✗ {$user->email}: AI вернул null");
                $failed++;
                continue;
            }

            // Сохраняем (updateOrCreate если --force)
            if ($existing) {
                $existing->update(['content' => $content, 'natal_data' => $natal, 'is_personal' => true]);
            } else {
                Horoscope::create([
                    'user_id' => $user->id,
                    'type' => 'general',
                    'is_personal' => true,
                    'content' => $content,
                    'natal_data' => $natal,
                ]);
            }

            $generated++;
            $this->info("✓ {$user->email} ({$profile->city})");
            usleep(500000); // 0.5s между запросами
        }

        $this->newLine();
        $this->info("Сгенерировано: {$generated}, пропущено: {$skipped}, ошибок: {$failed}");
        return self::SUCCESS;
    }
}
