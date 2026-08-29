<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_horoscopes', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('zodiac_sign', 10);
            $table->string('type')->default('general');
            $table->text('content');
            $table->timestamps();
            $table->unique(['date', 'zodiac_sign', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_horoscopes');
    }
};
