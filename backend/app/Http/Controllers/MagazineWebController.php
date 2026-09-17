<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\MagazineIssue;
use App\Services\MoonPhase;

class MagazineWebController extends Controller
{
    public function show(string $uuid)
    {
        \Carbon\Carbon::setLocale('ru');
        \Illuminate\Support\Facades\App::setLocale('ru');

        $issue = MagazineIssue::where('uuid', $uuid)->firstOrFail();

        // Фаза луны на дату выпуска
        $moon = MoonPhase::forDate($issue->issue_date)->toArray();

        // Последняя статья из «Блога редактора» (категория ID=5)
        $editorPost = BlogPost::where('blog_category_id', 5)
            ->published()
            ->orderByDesc('published_at')
            ->first(['id', 'title', 'slug', 'excerpt', 'cover_image', 'published_at']);

        return view('magazine.show', compact('issue', 'moon', 'editorPost'));
    }
}
