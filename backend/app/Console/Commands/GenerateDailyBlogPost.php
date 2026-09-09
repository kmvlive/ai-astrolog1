<?php

namespace App\Console\Commands;

use App\Services\AiService;
use Illuminate\Console\Command;

class GenerateDailyBlogPost extends Command
{
    protected $signature = 'blog:generate-daily';
    protected $description = 'Генерирует ежедневную ИИ-статью для блога';

    public function handle(AiService $ai): int
    {
        $this->info('Генерация статьи блога...');
        $post = $ai->generateBlogPost();
        if ($post) {
            $this->info("✓ Статья создана: «{$post->title}»");
            return 0;
        }
        $this->error('✗ Не удалось создать статью');
        return 1;
    }
}
