<?php

namespace App\Console\Commands;

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

        $post = null;
        $maxAttempts = 3;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $post = $ai->generateBlogPost();

            if (!$post) {
                $this->error('✗ Не удалось создать статью');
                return 1;
            }

            if ($this->titleIsFresh($post->title)) {
                $this->info("✓ Статья создана: «{$post->title}»");
                return 0;
            }

            $this->warn("⚠ Попытка {$attempt}: заголовок «{$post->title}» повторяет недавние — перегенерирую...");
            $postId = $post->id;
            $post->delete(); // убираем штампованную статью, чтобы не плодить дубли
            $post = null;
            sleep(2);
        }

        // Все попытки дали штампы — пробуем последний раз и принимаем как есть
        $post = $ai->generateBlogPost();
        if (!$post) {
            $this->error('✗ Не удалось создать статью');
            return 1;
        }
        $this->warn("⚠ Статья создана с НЕидеальным заголовком после {$maxAttempts} попыток: «{$post->title}»");
        return 0;
    }

    /**
     * Заголовок свежий, если:
     * - не начинается со слова-штампа (Главный, Ключевые, Тень, Тишина...)
     * - не построен по заезженному шаблону «... дня: ...»
     * - первое слово не совпадает с первым словом последних 8 заголовков
     */
    private function titleIsFresh(string $title): bool
    {
        $normalized = mb_strtolower(trim($title));
        $words = preg_split('/\s+/u', $normalized);
        $firstWord = rtrim($words[0] ?? '', ',.!?«»():;—-');

        if (in_array($firstWord, self::BANNED_FIRST_WORDS, true)) {
            return false;
        }

        if (preg_match('/^.{2,25} дня:/u', $normalized)) {
            return false;
        }

        $recent = DB::table('blog_posts')->orderByDesc('id')->limit(8)->pluck('title');
        foreach ($recent as $recentTitle) {
            $recentWords = preg_split('/\s+/u', mb_strtolower(trim($recentTitle)));
            if (($recentWords[0] ?? '') === $firstWord) {
                return false;
            }
        }

        return true;
    }
}
