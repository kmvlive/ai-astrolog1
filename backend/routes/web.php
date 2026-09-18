<?php

// Named route для Sanctum redirect (API использует JSON, но fallback нужен)
Route::get('/login', function () {
    return redirect('https://my.neiro-astro.ru/login');
})->name('login');

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/blog', [\App\Http\Controllers\BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/category/{category:slug}', [\App\Http\Controllers\BlogController::class, 'index'])->name('blog.category');
Route::get('/blog/rss', [\App\Http\Controllers\BlogController::class, 'rss'])->name('blog.rss');
Route::get('/blog/{post}', [\App\Http\Controllers\BlogController::class, 'show'])->name('blog.show');

// Sitemap сонника
Route::get('/sitemap-dreams.xml', function () {
    $symbols = \App\Models\DreamSymbol::where('approved', true)->orderBy('keyword')->pluck('keyword');

    $map = ['а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d','е'=>'e','ё'=>'yo','ж'=>'zh','з'=>'z','и'=>'i',
            'й'=>'y','к'=>'k','л'=>'l','м'=>'m','н'=>'n','о'=>'o','п'=>'p','р'=>'r','с'=>'s','т'=>'t',
            'у'=>'u','ф'=>'f','х'=>'kh','ц'=>'ts','ч'=>'ch','ш'=>'sh','щ'=>'sch','ъ'=>'','ы'=>'y','ь'=>'',
            'э'=>'e','ю'=>'yu','я'=>'ya'];
    $tr = fn($t) => str_replace(array_keys($map), array_values($map), mb_strtolower($t));

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    $xml .= '  <url><loc>https://my.neiro-astro.ru/dreams</loc><changefreq>daily</changefreq><priority>0.8</priority></url>' . "\n";
    foreach ($symbols as $kw) {
        $slug = $tr($kw);
        $xml .= '  <url><loc>https://my.neiro-astro.ru/dreams/' . $slug . '</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>' . "\n";
    }
    $xml .= '</urlset>';

    return response($xml, 200, [
        'Content-Type' => 'application/xml',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Pragma' => 'no-cache',
        'Expires' => '0',
    ]);
});

Route::get('/sitemap-names.xml', function () {
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "
";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "
";
    $xml .= '  <url><loc>https://my.neiro-astro.ru/names</loc><changefreq>daily</changefreq><priority>0.8</priority></url>' . "
";
    
    foreach (\App\Models\NameMeaning::where('approved', true)->get() as $nm) {
        $xml .= '  <url><loc>https://my.neiro-astro.ru/names/' . $nm->translit . '</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>' . "
";
    }
    
    $xml .= '</urlset>';
    return response($xml, 200)->header('Content-Type', 'application/xml');
});



// Публичная страница персонального журнала
Route::get('/magazine/{uuid}', [\App\Http\Controllers\MagazineWebController::class, 'show'])->name('magazine.show');


Route::get('/sitemap.xml', function () {
    $path = public_path('sitemap.xml');
    if (!file_exists($path)) {
        abort(404);
    }
    return response(file_get_contents($path), 200)
        ->header('Content-Type', 'application/xml');
});

