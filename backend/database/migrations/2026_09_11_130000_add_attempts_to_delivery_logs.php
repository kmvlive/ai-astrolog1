<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('delivery_logs', function (Blueprint $table) {
            $table->unsignedInteger('attempts')->default(1)->after('status');
            $table->timestamp('last_retry_at')->nullable()->after('attempts');
            $table->index(['event_type', 'status', 'attempts', 'created_at'], 'idx_retry_lookup');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_logs', function (Blueprint $table) {
            $table->dropIndex('idx_retry_lookup');
            $table->dropColumn(['attempts', 'last_retry_at']);
        });
    }
};
