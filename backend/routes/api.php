<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HoroscopeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\DailyHoroscopeController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Общие гороскопы — доступны БЕЗ регистрации
Route::get('/daily-horoscopes', [DailyHoroscopeController::class, 'index']);
Route::get('/daily-horoscopes/{slug}', [DailyHoroscopeController::class, 'show']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/horoscope/generate', [HoroscopeController::class, 'generate']);
    Route::get('/horoscopes', [HoroscopeController::class, 'index']);
});
