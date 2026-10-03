<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CalendarApiController extends Controller
{
    /**
     * Get current user info for calendar service
     */
    public function me(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'calendar_pro_enabled' => (bool) $user->calendar_pro_enabled,
            'created_at' => $user->created_at?->toISOString(),
        ]);
    }
}
