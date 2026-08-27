<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('generated_horoscopes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('horoscope_type_id')->constrained()->onDelete('cascade');
            $table->text('content'); // сгенерированный текст гороскопа
            $table->json('natal_data')->nullable(); // сырые данные натальной карты
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->index(['user_id', 'generated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_horoscopes');
    }
};
