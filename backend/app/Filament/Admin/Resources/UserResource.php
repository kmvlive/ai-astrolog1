<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class UserResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $navigationLabel = 'Пользователи';
    protected static ?string $modelLabel = 'Пользователь';
    protected static ?string $pluralModelLabel = 'Пользователи';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основная информация')
                    ->schema([
                        Forms\Components\TextInput::make('name')->label('Имя')->required()->maxLength(255),
                        Forms\Components\TextInput::make('email')->label('Email')->email()->required()->maxLength(255),
                        Forms\Components\Placeholder::make('is_admin_info')
                            ->label('Администратор')
                            ->content(fn ($record) => $record?->is_admin ? '✅ Да' : '❌ Нет — переключается кнопкой 👑 в списке'),
                        Forms\Components\Placeholder::make('opt_in_info')
                            ->label('Согласен на email-рассылку')
                            ->content(fn ($record) => $record?->email_opt_in ? '✅ Да' : '❌ Нет — переключается кнопкой 📧 в списке'),
                        Forms\Components\Toggle::make('calendar_pro_enabled')
                            ->label('PRO в календарях')
                            ->helperText('Дать пользователю тариф PRO в сервисе календарей')
                            ->default(false),
                        Forms\Components\Toggle::make('free_personal_enabled')
                            ->label('🎁 Бесплатный персональный гороскоп')
                            ->helperText('Получает персональный прогноз ежедневно в 9:00'),
                        Forms\Components\Toggle::make('free_natal_chart_enabled')
                            ->label('🎁 Бесплатная натальная карта')
                            ->helperText('Получает полную натальную карту с AI-интерпретацией и SVG-колесом'),
                    ])->columns(2),

                Forms\Components\Section::make('Подписка')
                    ->schema([
                        Forms\Components\TextInput::make('subscription.plan_type')->label('Тариф')->disabled(),
                        Forms\Components\TextInput::make('subscription.status')->label('Статус')->disabled(),
                        Forms\Components\TextInput::make('subscription.expires_at')->label('Действует до')->disabled(),
                    ])->columns(3),

                Forms\Components\Section::make('Профиль (данные рождения)')
                    ->relationship('profile')
                    ->schema([
                        Forms\Components\TextInput::make('city')->label('Город'),
                        Forms\Components\DatePicker::make('birth_date')->label('Дата рождения'),
                        Forms\Components\TextInput::make('birth_time')->label('Время (ЧЧ:ММ)')->placeholder('14:30'),
                        Forms\Components\TextInput::make('timezone')->label('Часовой пояс')->default('Europe/Moscow'),
                        Forms\Components\TextInput::make('latitude')->label('Широта'),
                        Forms\Components\TextInput::make('longitude')->label('Долгота'),
                    ])->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Пользователь')
                    ->description(fn ($record) => $record->email)
                    ->searchable(['name', 'email'])
                    ->sortable(),
                Tables\Columns\TextColumn::make('profile.city')->label('Город')->placeholder('—'),
                Tables\Columns\IconColumn::make('is_admin')->label('Админ')->boolean(),
                Tables\Columns\IconColumn::make('email_opt_in')->label('📧')->boolean(),
                Tables\Columns\ToggleColumn::make('calendar_pro_enabled')
                    ->label('PRO в календарях')
                    ->tooltip('Кликни, чтобы включить/выключить PRO в календарях'),
                Tables\Columns\IconColumn::make('free_personal_enabled')->label('🎁 Гороскоп')->boolean(),
                Tables\Columns\IconColumn::make('free_natal_chart_enabled')->label('🌟 Карта')->boolean(),
                Tables\Columns\TextColumn::make('subscription.status')
                    ->label('Подписка')->badge()->placeholder('—')
                    ->formatStateUsing(fn ($state) => match ((string) $state) {
                        'active' => 'Активна', 'trial' => 'Пробный',
                        'canceled' => 'Отменена', 'expired' => 'Истекла', default => '—',
                    })
                    ->color(fn ($state) => match ((string) $state) {
                        'active' => 'success', 'trial' => 'warning', default => 'gray',
                    }),
            ])
            ->defaultSort('id', 'desc')
            ->actions([
                Tables\Actions\Action::make('toggle_admin')
                    ->label(fn ($record) => $record->is_admin ? '👑 Снять админа' : '👑 Сделать админом')
                    ->color(fn ($record) => $record->is_admin ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->action(function ($record) {
                        if ($record->id === auth()->id() && $record->is_admin) {
                            Notification::make()->title('Нельзя снять права с себя')->danger()->send();
                            return;
                        }
                        $record->update(['is_admin' => !$record->is_admin]);
                        Notification::make()->title('Готово: админ ' . ($record->is_admin ? 'включён' : 'выключен'))->success()->send();
                    }),
                Tables\Actions\Action::make('toggle_optin')
                    ->label(fn ($record) => $record->email_opt_in ? '📧 Отключить рассылку' : '📧 Включить рассылку')
                    ->action(function ($record) {
                        $record->update(['email_opt_in' => !$record->email_opt_in]);
                        Notification::make()->title('Рассылка: ' . ($record->email_opt_in ? 'включена' : 'выключена'))->success()->send();
                    }),
                Tables\Actions\Action::make('toggle_natal')
                    ->label(fn ($record) => $record->free_natal_chart_enabled ? '🌟 Отключить натальную карту' : '🌟 Включить натальную карту')
                    ->color(fn ($record) => $record->free_natal_chart_enabled ? 'warning' : 'success')
                    ->action(function ($record) {
                        $record->update(['free_natal_chart_enabled' => !$record->free_natal_chart_enabled]);
                        Notification::make()->title('Натальная карта: ' . ($record->free_natal_chart_enabled ? 'включена' : 'выключена'))->success()->send();
                        
                        // Если включили — генерируем карту
                        if ($record->free_natal_chart_enabled && $record->profile && $record->profile->birth_date) {
                            dispatch(function () use ($record) {
                                try {
                                    $existing = \App\Models\NatalChart::where('user_id', $record->id)
                                        ->where('status', 'completed')->exists();
                                    if ($existing) return;
                                    
                                    $chart = \App\Models\NatalChart::create([
                                        'user_id' => $record->id,
                                        'birth_date' => $record->profile->birth_date,
                                        'birth_time' => $record->profile->birth_time,
                                        'city' => $record->profile->city,
                                        'latitude' => $record->profile->latitude,
                                        'longitude' => $record->profile->longitude,
                                        'status' => 'generating',
                                    ]);
                                    
                                    // SVG колесо
                                    $svgUrl = 'http://astro-neiro-python:8000/natal-chart/svg?' . http_build_query([
                                        'name' => $record->name ?? 'User',
                                        'birth_date' => $record->profile->birth_date->format('Y-m-d'),
                                        'birth_time' => $record->profile->birth_time ?? '12:00',
                                        'latitude' => $record->profile->latitude ?? 55.7558,
                                        'longitude' => $record->profile->longitude ?? 37.6173,
                                        'timezone' => $record->profile->timezone ?? 'Europe/Moscow',
                                    ]);
                                    $svgResponse = \Illuminate\Support\Facades\Http::timeout(30)->get($svgUrl);
                                    $svgPath = null;
                                    if ($svgResponse->successful() && strlen($svgResponse->body()) > 1000) {
                                        $svgPath = 'natal-charts/chart-' . $chart->id . '.svg';
                                        \Illuminate\Support\Facades\Storage::disk('public')->put($svgPath, $svgResponse->body());
                                    }
                                    
                                    // Данные планет
                                    $planetsData = null;
                                    try {
                                        $planetsResp = \Illuminate\Support\Facades\Http::timeout(30)->post('http://astro-neiro-python:8000/natal-chart', [
                                            'name' => $record->name ?? 'User',
                                            'birth_date' => $record->profile->birth_date->format('Y-m-d'),
                                            'birth_time' => $record->profile->birth_time ?? '12:00',
                                            'birth_city' => $record->profile->city ?? 'Moscow',
                                            'latitude' => (float) ($record->profile->latitude ?? 55.7558),
                                            'longitude' => (float) ($record->profile->longitude ?? 37.6173),
                                            'timezone' => $record->profile->timezone ?? 'Europe/Moscow',
                                        ]);
                                        if ($planetsResp->successful()) $planetsData = $planetsResp->json();
                                    } catch (\Exception $e) {}

                                    // AI интерпретация
                                    $ai = app(\App\Services\AiService::class);
                                    $interpretation = $ai->generateNatalChartInterpretation($chart);
                                    
                                    if ($interpretation) {
                                        $chart->update([
                                            'interpretation' => $interpretation,
                                            'chart_data' => ['svg_path' => $svgPath, 'planets' => $planetsData['planets'] ?? null, 'houses' => $planetsData['houses'] ?? null, 'ascendant' => $planetsData['ascendant'] ?? null, 'sun_sign' => $planetsData['sun_sign'] ?? null, 'moon_sign' => $planetsData['moon_sign'] ?? null],
                                            'status' => 'completed',
                                            'generated_at' => now(),
                                        ]);
                                    } else {
                                        $chart->update(['status' => 'failed']);
                                    }
                                } catch (\Exception $e) {
                                    \Illuminate\Support\Facades\Log::error('Free natal chart error', ['error' => $e->getMessage()]);
                                }
                            });
                        }
                    }),
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getRelations(): array { return []; }
    public static function getPages(): array { return ['index' => Pages\ListUsers::route('/'), 'edit' => Pages\EditUser::route('/{record}/edit')]; }
}
