<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('divination_results', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('type', 64);
            $table->text('question')->nullable();
            $table->longText('prediction');
            $table->timestamps();
            $table->index('type');
        });
    }
    public function down(): void { Schema::dropIfExists('divination_results'); }
};
