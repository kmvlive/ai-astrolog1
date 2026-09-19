<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('emails:resend-verification')->dailyAt('10:00')->timezone('Europe/Moscow');

// Гороскопы — фоновая генерация
Schedule::command('horoscope:generate-all --period=today')->dailyAt('02:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=tomorrow')->dailyAt('02:30')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=week')->weeklyOn(1, '03:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=month')->monthlyOn(1, '04:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=year')->yearlyOn(1, 1, '05:00')->timezone('Europe/Moscow');

// Рассылки гороскопов
Schedule::command('horoscope:send-daily-emails')->dailyAt('08:00')->timezone('Europe/Moscow')->withoutOverlapping(120);
Schedule::command('horoscope:send-daily-telegram')->dailyAt('08:05')->timezone('Europe/Moscow');
Schedule::command('horoscope:send-personal-emails')->dailyAt('09:00')->timezone('Europe/Moscow')->withoutOverlapping(120);
Schedule::command('horoscope:send-personal-telegram')->dailyAt('09:05')->timezone('Europe/Moscow');
Schedule::command('horoscope:delivery-audit')->dailyAt('10:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-free')->dailyAt('03:30')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-compatibility')->dailyAt('04:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-personal-free')->dailyAt('05:00')->timezone('Europe/Moscow');

// Подписки
Schedule::command('subscriptions:auto-renew')->dailyAt('09:00')->timezone('Europe/Moscow');
Schedule::command('subscriptions:expiry-reminders')->dailyAt('10:00')->timezone('Europe/Moscow');

// Блог
Schedule::command('blog:clean-covers')->dailyAt('04:30');
    Schedule::command('affirmation:generate-daily')->dailyAt('06:00');
    Schedule::command('affirmation:send-daily')->dailyAt('08:00');
    Schedule::command('sitemap:generate')->dailyAt('06:30');

// Рассылка календарей
Schedule::command('calendar:send-daily-emails')->dailyAt('07:30')->timezone('Europe/Moscow')->withoutOverlapping(120);
Schedule::command('calendar:send-daily-telegram')->dailyAt('07:35')->timezone('Europe/Moscow');
Schedule::command('calendar:send-daily-max')->dailyAt('07:40')->timezone('Europe/Moscow');

// Повтор фейлов — каждые 20 минут (cron)
Schedule::command('calendar:retry-failed')->cron('*/20 * * * *')->withoutOverlapping(5);

// Ежедневная генерация персональных журналов в 7:30
Schedule::command('magazine:generate')->dailyAt('07:30')->withoutOverlapping();

// Рассылка писем о готовых журналах в 7:35 (через 5 мин после генерации)
Schedule::command('magazine:send')->dailyAt('07:35')->withoutOverlapping();

use Illuminate\Support\Facades\Schedule;
Schedule::command('names:generate-images --limit=3')->everyTenMinutes()->withoutOverlapping();
