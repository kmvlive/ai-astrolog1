<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\ReferralCycle;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'free_personal_enabled',
        'free_natal_chart_enabled',
        'popup_dismissed_ids',
        'welcome_popup_shown',
        'referral_code',
        'referred_by',
        'name',
        'email',
        'password',
        'is_admin',
        'email_verification_token',
        'email_verification_sent_at',
        'email_opt_in',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'is_admin',
        'email_verification_token',
        'email_verification_sent_at',
        'email_opt_in',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function calendars(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Calendar::class, 'user_calendar');
    }

    public function horoscopeTypes(): BelongsToMany
    {
        return $this->belongsToMany(HoroscopeType::class, 'user_horoscope_types');
    }

    public function channels(): BelongsToMany
    {
        return $this->belongsToMany(Channel::class, 'user_channels')
            ->withPivot('channel_identifier', 'is_verified')
            ->withTimestamps();
    }

    public function generatedHoroscopes(): HasMany
    {
        return $this->hasMany(GeneratedHoroscope::class);
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(DeliveryLog::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function horoscopes()
    {
        return $this->hasMany(Horoscope::class)->orderByDesc("created_at");
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function hasActiveSubscription(): bool
    {
        return $this->subscription?->isActive() ?? false;
    }

    public function isOnTrial(): bool
    {
        if (!$this->subscription) {
            return false;
        }

        return $this->subscription->status === 'trial' 
            && $this->subscription->trial_ends_at 
            && $this->subscription->trial_ends_at->isFuture();
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return (bool) $this->is_admin;
    }

    // Referral system
    public function referrer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function referredUsers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    public function referralCycles(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ReferralCycle::class);
    }

    public function getActiveCyclesCount(): int
    {
        return $this->referralCycles()
            ->active()
            ->where('ends_at', '>', now())
            ->count();
    }

    public function canStartNewCycle(): bool
    {
        $activeCount = $this->getActiveCyclesCount();
        
        // Максимум 4 активных цикла
        if ($activeCount < 4) {
            return true;
        }
        
        // Проверяем самый старый активный цикл (прошло ли 10+ месяцев)
        $oldestCycle = $this->referralCycles()
            ->active()
            ->where('ends_at', '>', now())
            ->orderBy('started_at', 'asc')
            ->first();
        
        if ($oldestCycle && $oldestCycle->started_at->diffInMonths(now()) >= 10) {
            return true;
        }
        
        return false;
    }

    public function hasAccessToPersonalHoroscope(): bool
    {
        // Старое поле или активный цикл
        if ($this->free_personal_enabled) {
            return true;
        }
        
        return $this->referralCycles()
            ->active()
            ->where('ends_at', '>', now())
            ->exists();
    }

    public function getCurrentReferralProgress(): int
    {
        $currentCycle = $this->referralCycles()
            ->whereNull('started_at')
            ->latest()
            ->first();
        
        return $currentCycle ? $currentCycle->referrals_count : 0;
    }
}
