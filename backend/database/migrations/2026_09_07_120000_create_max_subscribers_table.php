<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('max_subscribers', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id')->unique();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('username')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('horoscope_types')->default('["general"]');
            $table->boolean('email_enabled')->default(true);
            $table->boolean('max_enabled')->default(true);
            $table->timestamp('last_activity_at')->nullable();
            $table->foreignId('user_id_fk')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('max_subscribers');
    }
};
