<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('name_meanings', function (Blueprint $table) {
            $table->string('origin')->nullable()->after('interpretation');
            $table->index('origin');
        });
    }

    public function down(): void
    {
        Schema::table('name_meanings', function (Blueprint $table) {
            $table->dropColumn('origin');
        });
    }
};
