<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('author_type')->default('ai'); // ai | human
            $table->string('author_name')->nullable();
            $table->string('cover_image')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->integer('views_count')->default(0);
            $table->timestamps();
            $table->index('published_at');
            $table->index('author_type');
        });
    }

    public function down(): void {
        Schema::dropIfExists('blog_posts');
    }
};
