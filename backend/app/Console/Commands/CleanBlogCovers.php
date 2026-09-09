<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanBlogCovers extends Command
{
    protected $signature = 'blog:clean-covers';
    protected $description = 'Удаляет неиспользуемые обложки блога';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $used = array_map('basename', BlogPost::whereNotNull('cover_image')->pluck('cover_image')->all());

        $deleted = 0;
        foreach ($disk->files('blog-covers') as $file) {
            if (!in_array(basename($file), $used, true) && $disk->lastModified($file) < time() - 86400) {
                $disk->delete($file);
                $deleted++;
            }
        }

        $this->info("Удалено файлов: {$deleted}");
        return self::SUCCESS;
    }
}
