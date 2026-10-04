<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\UserCalendar;
use Illuminate\Http\Request;

class CalendarCrudController extends Controller
{
    private const FREE_CALENDAR_LIMIT = 3;

    // ---------- КАЛЕНДАРИ ----------

    public function calendars(Request $request)
    {
        $user = $request->user();

        // Автосоздание дефолтного календаря при первом входе
        if (UserCalendar::where('user_id', $user->id)->count() === 0) {
            UserCalendar::create([
                'user_id' => $user->id,
                'name' => 'Личный',
                'color' => '#8b5cf6',
                'is_default' => true,
            ]);
        }

        $calendars = UserCalendar::where('user_id', $user->id)
            ->withCount('events')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'calendars' => $calendars->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'color' => $c->color,
                'is_default' => (bool) $c->is_default,
                'events_count' => $c->events_count,
            ]),
            'limits' => [
                'pro' => (bool) $user->calendar_pro_enabled,
                'max_free' => self::FREE_CALENDAR_LIMIT,
            ],
        ]);
    }

    public function createCalendar(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $count = UserCalendar::where('user_id', $user->id)->count();
        if (!$user->calendar_pro_enabled && $count >= self::FREE_CALENDAR_LIMIT) {
            return response()->json([
                'success' => false,
                'code' => 'LIMIT_REACHED',
                'message' => 'На бесплатном тарифе доступно до ' . self::FREE_CALENDAR_LIMIT . ' календарей. Включите PRO для безлимита.',
            ], 403);
        }

        $calendar = UserCalendar::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'color' => $data['color'] ?? '#3b82f6',
        ]);

        return response()->json([
            'success' => true,
            'calendar' => [
                'id' => $calendar->id,
                'name' => $calendar->name,
                'color' => $calendar->color,
                'is_default' => false,
                'events_count' => 0,
            ],
        ], 201);
    }

    public function updateCalendar(Request $request, int $id)
    {
        $calendar = UserCalendar::where('id', $id)->where('user_id', $request->user()->id)->first();
        if (!$calendar) {
            return response()->json(['success' => false, 'message' => 'Календарь не найден'], 404);
        }

        $data = $request->validate([
            'name' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $calendar->update(array_filter($data));

        return response()->json(['success' => true, 'calendar' => [
            'id' => $calendar->id,
            'name' => $calendar->name,
            'color' => $calendar->color,
        ]]);
    }

    public function deleteCalendar(Request $request, int $id)
    {
        $calendar = UserCalendar::where('id', $id)->where('user_id', $request->user()->id)->first();
        if (!$calendar) {
            return response()->json(['success' => false, 'message' => 'Календарь не найден'], 404);
        }

        $calendar->delete(); // события удалятся каскадно

        return response()->json(['success' => true]);
    }

    // ---------- СОБЫТИЯ ----------

    public function events(Request $request)
    {
        $user = $request->user();

        $q = CalendarEvent::where('user_id', $user->id);

        if ($request->filled('calendar_id')) {
            $q->where('calendar_id', (int) $request->calendar_id);
        }

        $start = $request->query('start');
        $end = $request->query('end');
        if ($start && $end) {
            $q->where('start_at', '<=', $end)
              ->where(function ($w) use ($start) {
                  $w->whereNull('end_at')->orWhere('end_at', '>=', $start);
              });
        }

        $events = $q->orderBy('start_at')->limit(500)->get();

        return response()->json([
            'success' => true,
            'events' => $events->map(fn ($e) => [
                'id' => $e->id,
                'calendar_id' => $e->calendar_id,
                'title' => $e->title,
                'description' => $e->description,
                'start' => $e->start_at->toISOString(),
                'end' => $e->end_at?->toISOString(),
                'all_day' => (bool) $e->all_day,
                'location' => $e->location,
                'color' => $e->color,
                'reminder_enabled' => (bool) $e->reminder_enabled,
            ]),
        ]);
    }

    public function createEvent(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'calendar_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start' => 'required|date',
            'end' => 'nullable|date',
            'all_day' => 'nullable|boolean',
            'location' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
        ]);

        $calendar = UserCalendar::where('id', $data['calendar_id'])->where('user_id', $user->id)->first();
        if (!$calendar) {
            return response()->json(['success' => false, 'message' => 'Календарь не найден'], 404);
        }

        $event = CalendarEvent::create([
            'calendar_id' => $calendar->id,
            'user_id' => $user->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'start_at' => $data['start'],
            'end_at' => $data['end'] ?? null,
            'all_day' => (bool) ($data['all_day'] ?? false),
            'location' => $data['location'] ?? null,
            'color' => $data['color'] ?? null,
        ]);

        return response()->json(['success' => true, 'event' => [
            'id' => $event->id,
            'calendar_id' => $event->calendar_id,
            'title' => $event->title,
            'start' => $event->start_at->toISOString(),
            'end' => $event->end_at?->toISOString(),
        ]], 201);
    }

    public function updateEvent(Request $request, int $id)
    {
        $event = CalendarEvent::where('id', $id)->where('user_id', $request->user()->id)->first();
        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Событие не найдено'], 404);
        }

        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'start' => 'nullable|date',
            'end' => 'nullable|date',
            'all_day' => 'nullable|boolean',
            'location' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'calendar_id' => 'nullable|integer',
        ]);

        if (!empty($data['calendar_id'])) {
            $cal = UserCalendar::where('id', $data['calendar_id'])->where('user_id', $request->user()->id)->first();
            if (!$cal) {
                return response()->json(['success' => false, 'message' => 'Календарь не найден'], 404);
            }
            $event->calendar_id = $cal->id;
        }

        $map = [
            'title' => 'title', 'description' => 'description',
            'start' => 'start_at', 'end' => 'end_at',
            'all_day' => 'all_day', 'location' => 'location', 'color' => 'color',
        ];
        foreach ($map as $in => $col) {
            if (array_key_exists($in, $data)) {
                $event->{$col} = $data[$in];
            }
        }
        $event->save();

        return response()->json(['success' => true, 'event' => [
            'id' => $event->id,
            'title' => $event->title,
            'start' => $event->start_at->toISOString(),
            'end' => $event->end_at?->toISOString(),
        ]]);
    }

    public function deleteEvent(Request $request, int $id)
    {
        $event = CalendarEvent::where('id', $id)->where('user_id', $request->user()->id)->first();
        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Событие не найдено'], 404);
        }

        $event->delete();

        return response()->json(['success' => true]);
    }
}
