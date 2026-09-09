<?php

namespace App\Console\Commands;

use App\Models\Channel;
use App\Models\TelegramSubscriber;
use App\Models\User;
use Illuminate\Console\Command;

class FixTelegramChannels extends Command
{
    protected $signature = 'fix:telegram-channels';
    protected $description = 'Включает канал Telegram всем, кто привязал бота';

    public function handle(): int
    {
        $ch = Channel::where('slug', 'telegram')->first();
        if (!$ch) { $this->error('Канал telegram не найден'); return self::FAILURE; }

        $subs = TelegramSubscriber::where('is_active', true)->whereNotNull('user_id')->get();
        $fixed = 0;
        foreach ($subs as $s) {
            $u = User::find($s->user_id);
            if (!$u) continue;
            if (!$u->channels()->where('channels.id', $ch->id)->exists()) {
                $u->channels()->attach($ch->id, ['channel_identifier' => null, 'is_verified' => true]);
                $fixed++;
                $this->info('✓ user ' . $u->id . ' (' . ($u->email ?? $u->name) . ')');
            }
        }
        $this->info('Исправлено: ' . $fixed);
        return self::SUCCESS;
    }
}
