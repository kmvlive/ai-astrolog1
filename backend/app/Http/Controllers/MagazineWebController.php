<?php

namespace App\Http\Controllers;

use App\Models\MagazineIssue;

class MagazineWebController extends Controller
{
    public function show(string $uuid)
    {
        \Carbon\Carbon::setLocale('ru');
        \Illuminate\Support\Facades\App::setLocale('ru');
        $issue = MagazineIssue::where('uuid', $uuid)->firstOrFail();
        return view('magazine.show', compact('issue'));
    }
}
