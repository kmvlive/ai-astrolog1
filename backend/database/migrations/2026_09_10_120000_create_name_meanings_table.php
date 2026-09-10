<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('name_meanings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('translit')->unique();
            $table->text('interpretation');
            $table->unsignedInteger('views')->default(0);
            $table->boolean('ai_generated')->default(false);
            $table->boolean('approved')->default(true);
            $table->timestamps();
            
            $table->index('name');
            $table->index('translit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('name_meanings');
    }
};
