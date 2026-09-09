<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use Illuminate\Support\Facades\Cache;

class AdController extends Controller
{
    public function index()
    {
        $ads = Cache::remember('active_ads', 300, function () {
            return Ad::active()->get();
        });

        return response()->json(['ads' => $ads]);
    }
}
