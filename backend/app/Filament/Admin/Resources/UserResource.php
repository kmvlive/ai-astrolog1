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
                        Forms\Components\Toggle::make('free_personal_enabled')
                            ->label('🎁 Бесплатный персональный гороскоп')
                            ->helperText('Получает персональный прогноз ежедневно в 9:00'),
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
                Tables\Columns\IconColumn::make('free_personal_enabled')->label('🎁')->boolean(),
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
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getRelations(): array { return []; }
    public static function getPages(): array { return ['index' => Pages\ListUsers::route('/'), 'edit' => Pages\EditUser::route('/{record}/edit')]; }
}
