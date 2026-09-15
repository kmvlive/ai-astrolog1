<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RetrogradeService;

class RetrogradeController extends Controller
{
    public function index(RetrogradeService $service)
    {
        return response()->json($service->summary());
    }
}
