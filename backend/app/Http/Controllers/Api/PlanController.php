<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;

class PlanController extends Controller
{
    public function index()
    {
        $plans = Plan::where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'price' => $p->price,
                'price_rub' => $p->price_rub,
                'formatted_price' => $p->formatted_price,
                'original_price' => $p->original_price,
                'formatted_original_price' => $p->formatted_original_price,
                'duration_days' => $p->duration_days,
                'features' => $p->features ?? [],
                'popular' => $p->popular,
            ]);

        return response()->json(['plans' => $plans]);
    }
}
