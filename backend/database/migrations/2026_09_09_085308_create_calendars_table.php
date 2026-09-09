<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('calendars', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 32)->unique();
            $table->string('name');
            $table->string('emoji', 8);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_calendar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('calendar_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'calendar_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('user_calendar');
        Schema::dropIfExists('calendars');
    }
};
