<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('natal_chart_weekly_opt_in')->default(false);
            $table->timestamp('natal_chart_weekly_subscribed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['natal_chart_weekly_opt_in', 'natal_chart_weekly_subscribed_at']);
        });
    }
};
