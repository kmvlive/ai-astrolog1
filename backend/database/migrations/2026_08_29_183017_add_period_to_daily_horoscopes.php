<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_horoscopes', function (Blueprint $table) {
            $table->string('period')->default('today')->after('type');
        });

        // PostgreSQL: удаляем constraint (не index)
        DB::statement('ALTER TABLE daily_horoscopes DROP CONSTRAINT IF EXISTS daily_horoscopes_date_zodiac_sign_type_unique');
        
        // Создаём новый constraint с period
        DB::statement('ALTER TABLE daily_horoscopes ADD CONSTRAINT daily_horoscopes_unique UNIQUE (date, zodiac_sign, type, period)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE daily_horoscopes DROP CONSTRAINT IF EXISTS daily_horoscopes_unique');
        DB::statement('ALTER TABLE daily_horoscopes ADD CONSTRAINT daily_horoscopes_date_zodiac_sign_type_unique UNIQUE (date, zodiac_sign, type)');
        
        Schema::table('daily_horoscopes', function (Blueprint $table) {
            $table->dropColumn('period');
        });
    }
};
