<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('free_daily_horoscopes', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('system');
            $table->string('sign');
            $table->text('content');
            $table->timestamps();
            $table->unique(['date', 'system', 'sign']);
        });

        Schema::create('compatibility_cache', function (Blueprint $table) {
            $table->id();
            $table->string('sign1');
            $table->string('sign2');
            $table->text('content');
            $table->timestamps();
            $table->unique(['sign1', 'sign2']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('free_daily_horoscopes');
        Schema::dropIfExists('compatibility_cache');
    }
};
