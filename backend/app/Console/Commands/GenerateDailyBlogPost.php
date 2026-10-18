<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use App\Services\AiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateDailyBlogPost extends Command
{
    protected $signature = 'blog:generate-daily';
    protected $description = 'Генерирует ежедневную ИИ-статью для блога';

    // Расширенный список штампов
    private const BANNED_FIRST_WORDS = [
        'главный', 'главная', 'главное',
        'ключевые', 'ключевая', 'ключевой',
        'тень', 'тени', 'теней',
        'тишина', 'тишины',
        'свет', 'света',
        'энергия', 'энергии',
        'переосмысление',  // новый штамп!
        'фокус',
        'вызов',
        'ловушка',
        'искусство',
    ];

    public function handle(AiService $ai): int
    {
        $this->info('Генерация статьи блога...');

        $today = now()->startOfDay();
        $existing = BlogPost::whereDate('published_at', $today)->where('author_type', 'ai')->first();
        if ($existing && $this->titleIsFresh($existing)) {
            $this->info("✓ Статья на сегодня уже есть: «{$existing->title}»");
            return 0;
        }
        if ($existing) {
            $this->warn("⚠ Удаляю статью с плохим заголовком: «{$existing->title}»");
            $existing->delete();
        }

        $post = null;
        $maxAttempts = 3;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $post = $ai->generateBlogPost();

            if (!$post) {
                $this->error('✗ Не удалось создать статью');
                return 1;
            }

            if ($this->titleIsFresh($post)) {
                $this->info("✓ Статья создана: «{$post->title}»");
                $this->generateCoverForPost($ai, $post);
                return 0;
            }

            $this->warn("⚠ Попытка {$attempt}: заголовок «{$post->title}» повторяет недавние — перегенерирую...");
            $post->delete();
            $post = null;
            sleep(2);
        }

        // ВСЕ 3 попытки провалились — НЕ генерируем обложку!
        // Сохраняем статью с fallback-заголовком, обложку добавим завтра
        $this->warn("⚠ Все {$maxAttempts} попытки дали плохие заголовки. Используем fallback.");
        
        $post = $ai->generateBlogPost();
        if (!$post) {
            $this->error('✗ Не удалось создать статью');
            return 1;
        }
        
        // Заменяем плохой заголовок на нейтральный
        $fallbackTitle = "Астрологический дневник: " . $today->translatedFormat('d F Y');
        $post->update([
            'title' => $fallbackTitle,
            'slug' => \Illuminate\Support\Str::slug($fallbackTitle) . '-' . $today->format('Ymd'),
        ]);
        
        $this->warn("⚠ Статья создана с нейтральным заголовком: «{$fallbackTitle}»");
        $this->warn("⚠ Обложка НЕ сгенерирована — добавьте вручную или дождитесь завтрашней генерации");
        // НЕ вызываем generateCoverForPost — экономим деньги!
        return 0;
    }

    private function generateCoverForPost(AiService $ai, BlogPost $post): void
    {
        try {
            $coverData = $ai->generateCover($post);
            if ($coverData) {
                $post->update([
                    'cover_image' => $coverData['path'],
                    'cover_subject' => $coverData['subject'],
                ]);
                $this->info("✓ Обложка сгенерирована: {$coverData['path']}");
            }
        } catch (\Throwable $e) {
            $this->warn("⚠ Не удалось создать обложку: {$e->getMessage()}");
        }
    }

    /**
     * Валидация заголовка.
     * Проверяем:
     * 1. Первое слово не в banned-списке
     * 2. Нет шаблона "X дня: Y"
     * 3. Первое слово не совпадает с 5 последними (ослаблено с 8)
     * 4. Заголовок не содержит слов из последних 3 статей в подстроке
     */
    private function titleIsFresh(BlogPost $post): bool
    {
        $title = $post->title;
        $normalized = mb_strtolower(trim($title));
        $words = preg_split('/\s+/u', $normalized);
        $firstWord = rtrim($words[0] ?? '', ',.!?«»():;—-');

        // 1. Запрещённые первые слова
        if (in_array($firstWord, self::BANNED_FIRST_WORDS, true)) {
            return false;
        }

        // 2. Шаблон "X дня: Y"
        if (preg_match('/^.{2,25} дня:/u', $normalized)) {
            return false;
        }

        // 3. Первое слово не совпадает с 5 последними (ослаблено с 8 — "Как" нормально)
        $recentFirstWords = DB::table('blog_posts')
            ->where('id', '!=', $post->id)
            ->orderByDesc('id')
            ->limit(5)
            ->pluck('title')
            ->map(function ($t) {
                $w = preg_split('/\s+/u', mb_strtolower(trim($t)));
                return rtrim($w[0] ?? '', ',.!?«»():;—-');
            });

        if ($recentFirstWords->contains($firstWord)) {
            return false;
        }

        // 4. Проверяем что в последних 3 статьях нет тех же ключевых слов
        // (защита от "Тишина как семя: переосмысление" когда уже есть "Тишина как семя")
        $recent3 = DB::table('blog_posts')
            ->where('id', '!=', $post->id)
            ->orderByDesc('id')
            ->limit(3)
            ->pluck('title');

        // Извлекаем существительные/глаголы из текущего заголовка (слова >4 символов)
        $significantWords = array_filter($words, fn($w) => mb_strlen($w) > 4);
        $significantWords = array_map(fn($w) => rtrim(mb_strtolower($w), ',.!?«»():;—-'), $significantWords);

        foreach ($recent3 as $recentTitle) {
            $recentNorm = mb_strtolower($recentTitle);
            foreach ($significantWords as $word) {
                if (mb_strlen($word) >= 5 && str_contains($recentNorm, $word)) {
                    // Нашли совпадение значимого слова с недавней статьёй
                    return false;
                }
            }
        }

        return true;
    }
}
