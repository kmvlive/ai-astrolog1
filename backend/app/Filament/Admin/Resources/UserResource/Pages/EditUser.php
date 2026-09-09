<?php

namespace App\Filament\Admin\Resources\UserResource\Pages;

use App\Filament\Admin\Resources\UserResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    public function getHeaderActions(): array { return [Actions\DeleteAction::make()]; }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $r = $this->getRecord();

        $p = $r->profile;
        if ($p) {
            $data['profile'] = [
                'city' => $p->city,
                'birth_date' => $p->birth_date,
                'birth_time' => $p->birth_time,
                'timezone' => $p->timezone,
                'latitude' => $p->latitude,
                'longitude' => $p->longitude,
            ];
        }

        $s = $r->subscription;
        if ($s) {
            $data['subscription'] = [
                'plan_type' => $s->plan_type,
                'status' => $s->status,
                'expires_at' => $s->expires_at ? $s->expires_at->format('d.m.Y') : null,
            ];
        }

        return $data;
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // Админ не может снять с себя права
        if ($this->getRecord()->id === auth()->id()) {
            $data['is_admin'] = true;
        }
        // read-only секции не трогаем
        unset($data['profile'], $data['subscription']);
        return $data;
    }

    protected function afterSave(): void
    {
        $record = $this->record->load('profile');
        $profile = $record->profile;
        if ($profile && $profile->city) {
            try {
                $url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' . urlencode($profile->city);
                $ctx = stream_context_create(['http' => ['header' => "User-Agent: AI-Astrolog-Admin/1.0\r\n", 'timeout' => 10]]);
                $res = json_decode(@file_get_contents($url, false, $ctx) ?: '[]', true);
                if (!empty($res[0]['lat'])) {
                    $profile->update(['latitude' => $res[0]['lat'], 'longitude' => $res[0]['lon']]);
                }
            } catch (\Throwable $e) {
                // геокодинг недоступен — координаты останутся как были
            }
        }
    }

}
