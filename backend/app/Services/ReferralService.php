<?php

namespace App\Services;

use App\Models\User;
use App\Models\ReferralCycle;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ReferralService
{
    /**
     * Генерация уникального referral_code для пользователя
     */
    public function generateReferralCode(User $user): string
    {
        if ($user->referral_code) {
            return $user->referral_code;
        }

        do {
            $code = strtoupper(Str::random(8));
        } while (User::where('referral_code', $code)->exists());

        $user->update(['referral_code' => $code]);
        return $code;
    }

    /**
     * Отслеживание реферала при регистрации
     */
    public function trackReferral(User $newUser, ?string $referralCode): void
    {
        if (!$referralCode) {
            return;
        }

        $referrer = User::where('referral_code', $referralCode)->first();
        if (!$referrer || $referrer->id === $newUser->id) {
            return;
        }

        $newUser->update(['referred_by' => $referrer->id]);
        $this->incrementCycle($referrer);
    }

    /**
     * Увеличение счётчика в текущем цикле
     */
    public function incrementCycle(User $user): void
    {
        // Находим текущий незаполненный цикл
        $currentCycle = $user->referralCycles()
            ->whereNull('started_at')
            ->latest()
            ->first();

        // Если нет — создаём новый
        if (!$currentCycle) {
            if (!$user->canStartNewCycle()) {
                return; // Достигнут лимит
            }
            $currentCycle = $this->createNewCycle($user);
        }

        $currentCycle->increment('referrals_count');

        // Проверяем условие 5/5
        if ($currentCycle->referrals_count >= 5) {
            $this->startCycle($currentCycle);
        }
    }

    /**
     * Создание нового цикла (ещё не запущенного)
     */
    public function createNewCycle(User $user): ReferralCycle
    {
        $cycleNumber = $user->referralCycles()->count() + 1;
        
        return ReferralCycle::create([
            'user_id' => $user->id,
            'cycle_number' => $cycleNumber,
            'referrals_count' => 0,
            'is_active' => false,
        ]);
    }

    /**
     * Запуск цикла (активация на 3 месяца)
     */
    public function startCycle(ReferralCycle $cycle): void
    {
        $startDate = now();
        $endDate = $startDate->copy()->addMonths(3);
        
        // Генерируем месяцы доступа
        $months = [];
        $current = $startDate->copy()->startOfMonth();
        while ($current->lt($endDate)) {
            $months[] = $current->format('Y-m');
            $current->addMonth();
        }

        $cycle->update([
            'started_at' => $startDate,
            'ends_at' => $endDate,
            'months' => $months,
            'is_active' => true,
        ]);
    }

    /**
     * Получение данных для профиля
     */
    public function getProfileData(User $user): array
    {
        $this->generateReferralCode($user);
        
        $activeCycles = $user->referralCycles()
            ->active()
            ->where('ends_at', '>', now())
            ->orderBy('started_at')
            ->get();

        $currentProgress = $user->getCurrentReferralProgress();
        $canStartNew = $user->canStartNewCycle();

        // Таблица всех месяцев с доступом
        $allMonths = [];
        foreach ($activeCycles as $cycle) {
            foreach ($cycle->months as $month) {
                if (!in_array($month, $allMonths)) {
                    $allMonths[] = $month;
                }
            }
        }
        sort($allMonths);

        return [
            'referral_link' => url('/?ref=' . $user->referral_code),
            'referral_code' => $user->referral_code,
            'progress' => $currentProgress,
            'target' => 5,
            'can_start_new_cycle' => $canStartNew && ($currentProgress === 0),
            'active_cycles_count' => $activeCycles->count(),
            'cycles' => $activeCycles->map(function ($cycle) {
                return [
                    'number' => $cycle->cycle_number,
                    'started_at' => $cycle->started_at->format('Y-m-d'),
                    'ends_at' => $cycle->ends_at->format('Y-m-d'),
                    'months' => $cycle->months,
                    'days_left' => $cycle->ends_at->diffInDays(now(), false),
                ];
            }),
            'accessible_months' => $allMonths,
            'total_access_months' => count($allMonths),
        ];
    }
}
