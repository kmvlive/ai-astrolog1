<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Удаляю существующие дубли для PostgreSQL
        DB::statement("
            DELETE FROM delivery_logs
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, 
                           ROW_NUMBER() OVER (
                               PARTITION BY user_id, event_type, DATE(created_at) 
                               ORDER BY id
                           ) AS rn
                    FROM delivery_logs
                ) sub
                WHERE rn > 1
            )
        ");

        // Уникальный индекс на PostgreSQL — с выражением DATE(created_at)
        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS delivery_unique_per_day 
            ON delivery_logs (user_id, event_type, DATE(created_at))
        ");
    }

    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS delivery_unique_per_day");
    }
};
