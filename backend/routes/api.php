<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HoroscopeController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Профиль
    Route::put('/profile', [ProfileController::class, 'update']);
    
    // Гороскопы
    Route::post('/horoscope/generate', [HoroscopeController::class, 'generate']);
    Route::get('/horoscopes', [HoroscopeController::class, 'index']);
});
