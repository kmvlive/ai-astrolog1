<?php

namespace App\Filament\Admin\Pages;

use App\Models\BlogPost;
use App\Models\DeliveryLog;
use App\Models\Subscription;
use App\Models\TelegramSubscriber;
use App\Models\User;
use App\Models\UserProfile;
use Filament\Pages\Page;
use Illuminate\Support\Facades\DB;

class AnalyticsDashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';
    protected static ?string $navigationLabel = 'Аналитика';
    protected static ?string $title = '📊 Аналитика';
    protected static ?int $navigationSort = 0;
    protected static string $view = 'filament.admin.pages.analytics-dashboard';
    protected static ?string $slug = 'analytics';

    public array $stats = [];
    public array $delivery = [];
    public array $zodiac = [];
    public array $topPosts = [];
    public array $funnel = [];
    public array $regWeeks = [];

    public function mount(): void
    {
        $total = User::count();
        $confirmed = User::whereNotNull('email_verified_at')->count();
        $personal = User::where('free_personal_enabled', true)->count();

        $this->stats = [
            'total' => $total,
            'week' => User::where('created_at', '>=', now()->subDays(7))->count(),
            'month' => User::where('created_at', '>=', now()->subDays(30))->count(),
            'confirmed' => $confirmed,
            'personal' => $personal,
            'paid' => Subscription::where('status', 'active')->count(),
            'tg' => TelegramSubscriber::count(),
        ];

        $this->delivery = DeliveryLog::select('event_type',
            DB::raw("count(*) filter (where status = 'sent') as sent"),
            DB::raw("count(*) filter (where status = 'failed') as failed"),
            DB::raw('count(*) as total'))
            ->groupBy('event_type')->orderByDesc('total')->limit(6)->get()
            ->map(fn ($r) => $r->toArray())->all();

        $counts = [];
        foreach (UserProfile::whereNotNull('birth_date')->pluck('birth_date') as $d) {
            $t = strtotime(is_object($d) ? $d->format('Y-m-d') : (string) $d);
            if (!$t) continue;
            $sign = $this->sign((int) date('n', $t), (int) date('j', $t));
            $counts[$sign] = ($counts[$sign] ?? 0) + 1;
        }
        arsort($counts);
        $this->zodiac = array_slice($counts, 0, 6, true);

        $this->topPosts = BlogPost::published()->orderByDesc('views_count')->limit(5)->get()
            ->map(fn ($p) => ['title' => $p->title, 'views' => $p->views_count, 'date' => $p->published_at?->format('d.m.Y')])->all();

        $pct = fn ($n) => $total > 0 ? round($n / $total * 100) : 0;
        $this->funnel = [
            ['label' => 'Зарегистрировались', 'count' => $total, 'pct' => 100],
            ['label' => 'Подтвердили email', 'count' => $confirmed, 'pct' => $pct($confirmed)],
            ['label' => 'Включили персональные', 'count' => $personal, 'pct' => $pct($personal)],
            ['label' => 'Оплатили подписку', 'count' => $this->stats['paid'], 'pct' => $pct($this->stats['paid'])],
        ];

        $rows = User::select(DB::raw("date_trunc('week', created_at) as w"), DB::raw('count(*) as c'))
            ->where('created_at', '>=', now()->subWeeks(8))
            ->groupBy('w')->orderBy('w')->get();
        $max = max(1, (int) $rows->max('c'));
        $this->regWeeks = $rows->map(fn ($r) => [
            'label' => \Carbon\Carbon::parse($r->w)->format('d.m'),
            'count' => (int) $r->c,
            'height' => (int) round($r->c / $max * 100),
        ])->all();
    }

    private function sign(int $m, int $d): string
    {
        $z = [
            [1,20,2,18,'♒ Водолей'], [2,19,3,20,'♓ Рыбы'], [3,21,4,19,'♈ Овен'],
            [4,20,5,20,'♉ Телец'], [5,21,6,20,'♊ Близнецы'], [6,21,7,22,'♋ Рак'],
            [7,23,8,22,'♌ Лев'], [8,23,9,22,'♍ Дева'], [9,23,10,22,'♎ Весы'],
            [10,23,11,21,'♏ Скорпион'], [11,22,12,21,'♐ Стрелец'], [12,22,12,31,'♑ Козерог'], [1,1,1,19,'♑ Козерог'],
        ];
        foreach ($z as $s) {
            if ($m == $s[0] && $d >= $s[1] || $m == $s[2] && $d <= $s[3]) return $s[4];
        }
        return '♑ Козерог';
    }
}
