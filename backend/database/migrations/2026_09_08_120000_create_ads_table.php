<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->string('title')->comment('Заголовок рекламы');
            $table->text('description')->comment('Описание');
            $table->string('cta_text')->default('Подробнее')->comment('Текст кнопки');
            $table->string('cta_url')->comment('Ссылка кнопки');
            $table->string('gradient_from')->default('from-violet-900/30')->comment('Градиент от');
            $table->string('gradient_to')->default('to-indigo-900/30')->comment('Градиент до');
            $table->string('emoji')->default('✨')->comment('Эмодзи');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ads');
    }
};
