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

    private const BANNED_FIRST_WORDS = [
        'главный', 'главная', 'главное',
        'ключевые', 'ключевая', 'ключевой',
        'тень', 'тишина', 'свет', 'энергия', 'энергии',
    ];

    public function handle(AiService $ai): int
    {
        $this->info('Генерация статьи блога...');

        // Проверка: статья на сегодня уже есть?
        $today = now()->startOfDay();
        $existing = BlogPost::whereDate('published_at', $today)->where('author_type', 'ai')->first();
        if ($existing && $this->titleIsFresh($existing)) {
            $this->info("✓ Статья на сегодня уже есть: «{$existing->title}»");
            return 0;
        }
        // Если есть, но с плохим заголовком — удаляем и перегенерируем
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
                return 0;
            }

            $this->warn("⚠ Попытка {$attempt}: заголовок «{$post->title}» повторяет недавние — перегенерирую...");
            $post->delete();
            $post = null;
            sleep(2);
        }

        // Финальная попытка — принимаем что есть
        $post = $ai->generateBlogPost();
        if (!$post) {
            $this->error('✗ Не удалось создать статью');
            return 1;
        }
        $this->warn("⚠ Статья с НЕидеальным заголовком после {$maxAttempts} попыток: «{$post->title}»");
        return 0;
    }

    /**
     * Заголовок свежий, если:
     * - не начинается со слова-штампа
     * - не построен по шаблону «... дня: ...»
     * - первое слово отличается от первых слов 8 предыдущих заголовков
     * ВАЖНО: исключаем ТЕКУЩУЮ статью из сравнения (иначе сравнивает сама с собой)
     */
    private function titleIsFresh(BlogPost $post): bool
    {
        $title = $post->title;
        $normalized = mb_strtolower(trim($title));
        $words = preg_split('/\s+/u', $normalized);
        $firstWord = rtrim($words[0] ?? '', ',.!?«»():;—-');

        if (in_array($firstWord, self::BANNED_FIRST_WORDS, true)) {
            return false;
        }

        if (preg_match('/^.{2,25} дня:/u', $normalized)) {
            return false;
        }

        // ИСКЛЮЧАЕМ текущую статью по ID!
        $recent = DB::table('blog_posts')
            ->where('id', '!=', $post->id)
            ->orderByDesc('id')
            ->limit(8)
            ->pluck('title');

        foreach ($recent as $recentTitle) {
            $recentWords = preg_split('/\s+/u', mb_strtolower(trim($recentTitle)));
            if (($recentWords[0] ?? '') === $firstWord) {
                return false;
            }
        }

        return true;
    }
}
