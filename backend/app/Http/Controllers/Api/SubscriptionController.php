<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\HoroscopeType;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function getSettings(Request $request)
    {
        $user = $request->user();

        $userChannels = $user->channels()->get();
        $userChannelSlugs = $userChannels->pluck('slug')->toArray();
        $userTypes = $user->horoscopeTypes()->pluck('slug')->toArray();

        $availableChannels = Channel::where('is_active', true)->get();

        // Только бесплатные тематические типы (периоды и дневной-платный исключены)
        $availableTypes = HoroscopeType::where('is_active', true)->get();

        return response()->json([
            'channels' => $availableChannels,
            'user_channel_slugs' => $userChannelSlugs,
            'types' => $availableTypes,
            'user_type_slugs' => $userTypes,
            'email' => $user->email,
            'has_email_subscription' => in_array('email', $userChannelSlugs),
            'has_active_subscription' => $user->hasActiveSubscription(),
            'is_on_trial' => $user->isOnTrial(),
            'subscription' => $user->subscription,
        ]);
    }

    public function updateChannels(Request $request)
    {
        $request->validate([
            'channels' => 'required|array',
            'channels.*' => 'in:email,telegram,max',
        ]);

        $user = $request->user();
        $requestedSlugs = $request->channels;

        $allChannels = Channel::whereIn('slug', ['email', 'telegram', 'max'])->get()->keyBy('slug');
        $currentChannelIds = $user->channels()->pluck('channels.id')->toArray();

        foreach ($requestedSlugs as $slug) {
            if (isset($allChannels[$slug])) {
                $channel = $allChannels[$slug];
                if (!in_array($channel->id, $currentChannelIds)) {
                    $user->channels()->attach($channel->id, [
                        'channel_identifier' => $slug === 'email' ? $user->email : null,
                        'is_verified' => $slug === 'email',
                    ]);
                }
            }
        }

        foreach ($currentChannelIds as $channelId) {
            $channel = $allChannels->firstWhere('id', $channelId);
            if ($channel && !in_array($channel->slug, $requestedSlugs)) {
                $user->channels()->detach($channelId);
            }
        }

        return response()->json(['success' => true, 'message' => 'Каналы доставки обновлены']);
    }

    public function updateTypes(Request $request)
    {
        $request->validate([
            'types' => 'required|array',
            'types.*' => 'in:general,love,career,finance,health',
        ]);

        $user = $request->user();
        $requestedSlugs = $request->types;

        $allTypes = HoroscopeType::whereIn('slug', $requestedSlugs)->pluck('id', 'slug');
        $currentTypeIds = $user->horoscopeTypes()->pluck('horoscope_types.id')->toArray();

        foreach ($requestedSlugs as $slug) {
            if (isset($allTypes[$slug]) && !in_array($allTypes[$slug], $currentTypeIds)) {
                $user->horoscopeTypes()->attach($allTypes[$slug]);
            }
        }

        foreach ($currentTypeIds as $typeId) {
            $keep = false;
            foreach ($requestedSlugs as $slug) {
                if (isset($allTypes[$slug]) && $allTypes[$slug] === $typeId) {
                    $keep = true;
                    break;
                }
            }
            if (!$keep) {
                $user->horoscopeTypes()->detach($typeId);
            }
        }

        return response()->json(['success' => true, 'message' => 'Типы гороскопов обновлены']);
    }
}
