<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('emails:resend-verification')->dailyAt('10:00')->timezone('Europe/Moscow');

// Гороскопы — генерация (как было, оставляем ночью)
Schedule::command('horoscope:generate-all --period=today')->dailyAt('02:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=tomorrow')->dailyAt('02:30')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=week')->weeklyOn(1, '03:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=month')->monthlyOn(1, '04:00')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-all --period=year')->yearlyOn(1, 1, '05:00')->timezone('Europe/Moscow');

// Рассылки — сдвинуты на 00:30-03:40 (рано утром, до пробуждения людей)
Schedule::command('magazine:generate')->dailyAt('00:30')->withoutOverlapping();
Schedule::command('magazine:send')->dailyAt('00:35')->withoutOverlapping();
Schedule::command('calendar:send-daily-emails')->dailyAt('00:40')->timezone('Europe/Moscow')->withoutOverlapping(120);
Schedule::command('calendar:send-daily-telegram')->dailyAt('00:45')->timezone('Europe/Moscow')->withoutOverlapping(30);
Schedule::command('calendar:send-daily-max')->dailyAt('00:50')->timezone('Europe/Moscow')->withoutOverlapping(30);
Schedule::command('affirmation:send-daily')->dailyAt('01:00')->withoutOverlapping(30);
Schedule::command('subscriptions:auto-renew')->dailyAt('01:30')->timezone('Europe/Moscow');
Schedule::command('subscriptions:expiry-reminders')->dailyAt('01:45')->timezone('Europe/Moscow');
Schedule::command('horoscope:send-daily-emails')->dailyAt('03:00')->timezone('Europe/Moscow')->withoutOverlapping(120);
Schedule::command('horoscope:send-daily-telegram')->dailyAt('03:05')->timezone('Europe/Moscow')->withoutOverlapping(30);
Schedule::command('horoscope:generate-free')->dailyAt('03:30')->timezone('Europe/Moscow')->withoutOverlapping(60);
Schedule::command('horoscope:send-personal-emails')->dailyAt('03:35')->timezone('Europe/Moscow')->withoutOverlapping(120);
Schedule::command('horoscope:send-personal-telegram')->dailyAt('03:40')->timezone('Europe/Moscow')->withoutOverlapping(30);
Schedule::command('horoscope:generate-compatibility')->dailyAt('04:00')->timezone('Europe/Moscow')->withoutOverlapping(60);
Schedule::command('horoscope:delivery-audit')->dailyAt('04:15')->timezone('Europe/Moscow');
Schedule::command('horoscope:generate-personal-free')->dailyAt('05:00')->timezone('Europe/Moscow');

// Подписки
Schedule::command('blog:clean-covers')->dailyAt('04:30');
Schedule::command('affirmation:generate-daily')->dailyAt('06:00');
Schedule::command('sitemap:generate')->dailyAt('06:30');

// Повтор фейлов — каждые 20 минут (cron)
Schedule::command('calendar:retry-failed')->cron('*/20 * * * *')->withoutOverlapping(5);

// Генерация картинок
Schedule::command('names:generate-images --limit=3')->everyTenMinutes()->withoutOverlapping();

// Мониторинг здоровья системы — каждые 30 минут
Schedule::command('system:health-check')->everyThirtyMinutes()->withoutOverlapping();
