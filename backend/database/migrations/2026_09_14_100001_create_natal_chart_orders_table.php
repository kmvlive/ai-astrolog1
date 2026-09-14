<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('natal_chart_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('natal_chart_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['one_time', 'subscription'])->default('one_time');
            $table->integer('amount'); // в копейках
            $table->enum('status', ['new', 'paid', 'failed', 'refunded'])->default('new');
            $table->string('tbank_payment_id')->nullable();
            $table->boolean('weekly_horoscope_opt_in')->default(false);
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('natal_chart_orders');
    }
};
