<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('destiny_matrices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->date('birth_date');
            $table->json('positions');
            $table->text('interpretation');
            $table->uuid('uuid')->unique();
            $table->timestamps();
            $table->index(['user_id', 'birth_date']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('destiny_matrices');
    }
};
