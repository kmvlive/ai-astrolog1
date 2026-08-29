<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HoroscopeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\DailyHoroscopeController;
use App\Http\Controllers\Api\SubscribeController;
use Illuminate\Support\Facades\Route;

// ===== Public routes =====
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Публичная подписка на ежедневный гороскоп (без регистрации)
Route::post('/subscribe-daily', [SubscribeController::class, 'subscribe']);

// Общие гороскопы — доступны БЕЗ регистрации
Route::get('/daily-horoscopes', [DailyHoroscopeController::class, 'index']);
Route::get('/daily-horoscopes/{slug}', [DailyHoroscopeController::class, 'show']);

// ===== Protected routes =====
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/subscription/settings', [\App\Http\Controllers\Api\SubscriptionController::class, 'getSettings']);
    Route::post('/subscription/channels', [\App\Http\Controllers\Api\SubscriptionController::class, 'updateChannels']);
    Route::post('/subscription/types', [\App\Http\Controllers\Api\SubscriptionController::class, 'updateTypes']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/horoscope/generate', [HoroscopeController::class, 'generate']);
    Route::get('/horoscopes', [HoroscopeController::class, 'index']);
});
