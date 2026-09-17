<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('magazine_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('issue_date');
            $table->uuid('uuid')->unique();
            $table->json('content'); // Снимок выпуска (гороскоп, аффирмация, таро, блог)
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'issue_date']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('magazine_subscribed')->default(false)->after('digest_prefs');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('magazine_issues');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('magazine_subscribed');
        });
    }
};
