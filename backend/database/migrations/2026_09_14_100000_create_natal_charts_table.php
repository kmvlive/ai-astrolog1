<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('natal_charts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('birth_date');
            $table->string('birth_time')->nullable(); // HH:mm
            $table->string('gender')->nullable(); // male, female
            $table->string('city')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->json('chart_data')->nullable(); // позиции планет, дома и т.д.
            $table->text('interpretation')->nullable(); // полная AI-интерпретация
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('natal_charts');
    }
};
