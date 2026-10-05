<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dream_symbols', function (Blueprint $table) {
            $table->unique('keyword', 'dream_symbols_keyword_unique');
        });
    }

    public function down(): void
    {
        Schema::table('dream_symbols', function (Blueprint $table) {
            $table->dropUnique('dream_symbols_keyword_unique');
        });
    }
};
