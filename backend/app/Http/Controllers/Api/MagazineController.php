<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MagazineIssue;
use Illuminate\Http\Request;

class MagazineController extends Controller
{
    public function myIssues(Request $request)
    {
        $issues = MagazineIssue::where('user_id', $request->user()->id)
            ->orderBy('issue_date', 'desc')
            ->limit(5)
            ->get(['id', 'issue_date', 'uuid', 'sent_at']);

        return response()->json([
            'subscribed' => $request->user()->magazine_subscribed,
            'issues' => $issues->map(fn($i) => [
                'uuid' => $i->uuid,
                'date' => $i->issue_date->format('Y-m-d'),
                'sent' => !!$i->sent_at,
            ]),
        ]);
    }

    public function subscribe(Request $request)
    {
        $request->user()->update(['magazine_subscribed' => true]);
        return response()->json(['success' => true, 'subscribed' => true]);
    }

    public function unsubscribe(Request $request)
    {
        $request->user()->update(['magazine_subscribed' => false]);
        return response()->json(['success' => true, 'subscribed' => false]);
    }
}
