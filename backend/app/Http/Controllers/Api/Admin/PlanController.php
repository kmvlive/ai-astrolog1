<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index()
    {
        return response()->json([
            'plans' => Plan::orderBy('sort_order')->get()
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'slug' => 'required|string|max:50|unique:plans,slug',
            'name' => 'required|string|max:100',
            'price' => 'required|integer|min:0',
            'original_price' => 'nullable|integer|min:0',
            'original_price' => 'nullable|integer|min:0',
            'duration_days' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'features.*' => 'string|max:200',
            'active' => 'boolean',
            'popular' => 'boolean',
            'sort_order' => 'integer',
        ]);

        return response()->json([
            'plan' => Plan::create($data)
        ], 201);
    }

    public function update(Request $request, Plan $plan)
    {
        $data = $request->validate([
            'slug' => 'required|string|max:50|unique:plans,slug,' . $plan->id,
            'name' => 'required|string|max:100',
            'price' => 'required|integer|min:0',
            'original_price' => 'nullable|integer|min:0',
            'original_price' => 'nullable|integer|min:0',
            'duration_days' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'features.*' => 'string|max:200',
            'active' => 'boolean',
            'popular' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $plan->update($data);
        return response()->json(['plan' => $plan]);
    }

    public function destroy(Plan $plan)
    {
        $plan->delete();
        return response()->json(['success' => true]);
    }
}
