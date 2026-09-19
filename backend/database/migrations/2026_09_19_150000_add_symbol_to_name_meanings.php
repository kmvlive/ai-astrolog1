<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('name_meanings', function (Blueprint $table) {
            $table->string('symbol', 255)->nullable()->after('image');
        });
    }
    public function down(): void
    {
        Schema::table('name_meanings', function (Blueprint $table) {
            $table->dropColumn('symbol');
        });
    }
};
