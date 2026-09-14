<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('popup_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->string('icon')->default('🔔');
            $table->string('link_url')->nullable();
            $table->string('link_text')->nullable()->default('Подробнее');
            $table->string('dismiss_text')->nullable()->default('Закрыть');
            $table->enum('type', ['info', 'promo', 'urgent', 'horoscope'])->default('info');
            $table->boolean('is_active')->default(true);
            $table->boolean('show_once')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->integer('priority')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('popup_notifications');
    }
};
