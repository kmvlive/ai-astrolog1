<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affirmation;
use Illuminate\Http\Request;

class AffirmationController extends Controller
{
    public function today()
    {
        $today = now()->startOfDay();
        $affirmation = Affirmation::forDate($today)->first();
        
        if (!$affirmation) {
            // Генерируем на лету если нет
            app(\App\Console\Commands\GenerateDailyAffirmation::class)->handle(app(\App\Services\AiService::class));
            $affirmation = Affirmation::forDate($today)->first();
        }

        return response()->json($affirmation);
    }

    public function calendar(Request $request)
    {
        $days = $request->input('days', 30);
        $affirmations = Affirmation::upcoming($days)->get();
        
        return response()->json($affirmations);
    }
}
