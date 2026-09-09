<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('rebill_id')->nullable()->index();
            $table->boolean('auto_renew')->default(false);
            $table->timestamp('last_rebill_at')->nullable();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->boolean('auto_renew')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['rebill_id', 'auto_renew', 'last_rebill_at']);
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('auto_renew');
        });
    }
};
