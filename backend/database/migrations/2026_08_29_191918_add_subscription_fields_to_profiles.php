<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('daily_horoscope_type')->default('general')->after('birth_place');
            $table->string('daily_horoscope_time')->default('08:00')->after('daily_horoscope_type');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['daily_horoscope_type', 'daily_horoscope_time']);
        });
    }
};
