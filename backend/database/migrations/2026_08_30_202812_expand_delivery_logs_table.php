<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Удаляем foreign key constraint (если есть)
        Schema::table('delivery_logs', function (Blueprint $table) {
            $table->dropForeign(['channel_id']);
        });

        // 2. Изменяем тип поля channel_id на string и делаем nullable
        DB::statement('ALTER TABLE delivery_logs ALTER COLUMN channel_id TYPE VARCHAR(255)');
        DB::statement('ALTER TABLE delivery_logs ALTER COLUMN channel_id DROP NOT NULL');

        // 3. Изменяем generated_horoscope_id на nullable
        DB::statement('ALTER TABLE delivery_logs ALTER COLUMN generated_horoscope_id DROP NOT NULL');

        // 4. Добавляем новые поля
        Schema::table('delivery_logs', function (Blueprint $table) {
            $table->string('event_type', 50)->default('daily')->after('user_id');
            $table->string('recipient_email')->nullable()->after('event_type');
            $table->string('subject')->nullable()->after('recipient_email');
            $table->json('metadata')->nullable()->after('error_message');
            $table->index(['event_type']);
            $table->index(['user_id', 'event_type']);
        });

        // 5. Заполняем event_type для существующих записей
        DB::table('delivery_logs')
            ->whereNull('event_type')
            ->orWhere('event_type', '')
            ->update(['event_type' => 'daily']);
    }

    public function down(): void
    {
        Schema::table('delivery_logs', function (Blueprint $table) {
            $table->dropColumn(['event_type', 'recipient_email', 'subject', 'metadata']);
        });
    }
};
