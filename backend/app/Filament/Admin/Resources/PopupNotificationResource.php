<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\PopupNotificationResource\Pages;
use App\Models\PopupNotification;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PopupNotificationResource extends Resource
{
    protected static ?string $model = PopupNotification::class;
    protected static ?string $navigationIcon = 'heroicon-o-megaphone';
    protected static ?string $navigationLabel = 'Popup-уведомления';
    protected static ?string $modelLabel = 'Popup-уведомление';
    protected static ?string $pluralModelLabel = 'Popup-уведомления';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Содержание')
                ->schema([
                    Forms\Components\TextInput::make('icon')
                        ->label('Иконка (эмодзи)')
                        ->default('🔔')
                        ->maxLength(10),
                    Forms\Components\TextInput::make('title')
                        ->label('Заголовок')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('Ваш гороскоп готов!'),
                    Forms\Components\Textarea::make('body')
                        ->label('Текст')
                        ->required()
                        ->rows(4)
                        ->placeholder('Сегодня звёзды благоприятны для новых начинаний...'),
                    Forms\Components\Select::make('type')
                        ->label('Тип')
                        ->options([
                            'info' => 'ℹ️ Информация',
                            'promo' => '🎁 Промо',
                            'urgent' => '⚡ Срочное',
                            'horoscope' => '🔮 Гороскоп',
                        ])
                        ->default('info'),
                ])->columns(2),

            Forms\Components\Section::make('Ссылка')
                ->schema([
                    Forms\Components\TextInput::make('link_url')
                        ->label('URL ссылки')
                        ->placeholder('/dashboard или https://...')
                        ->url(),
                    Forms\Components\TextInput::make('link_text')
                        ->label('Текст кнопки')
                        ->default('Подробнее')
                        ->maxLength(50),
                    Forms\Components\TextInput::make('dismiss_text')
                        ->label('Текст закрытия')
                        ->default('Закрыть')
                        ->maxLength(50),
                ])->columns(3),

            Forms\Components\Section::make('Настройки показа')
                ->schema([
                    Forms\Components\Toggle::make('is_active')
                        ->label('Активно')
                        ->default(true),
                    Forms\Components\Toggle::make('show_once')
                        ->label('Показать один раз')
                        ->helperText('После закрытия больше не показывать этому пользователю')
                        ->default(true),
                    Forms\Components\DateTimePicker::make('starts_at')
                        ->label('Начало показа')
                        ->helperText('Оставьте пустым для немедленного показа'),
                    Forms\Components\DateTimePicker::make('ends_at')
                        ->label('Конец показа')
                        ->helperText('Оставьте пустым для бессрочного показа'),
                    Forms\Components\TextInput::make('priority')
                        ->label('Приоритет')
                        ->numeric()
                        ->default(0)
                        ->helperText('Высший приоритет показывается первым'),
                ])->columns(3),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('icon')->label('')->size('lg'),
                Tables\Columns\TextColumn::make('title')->label('Заголовок')->searchable()->limit(40),
                Tables\Columns\TextColumn::make('type')
                    ->label('Тип')->badge()
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'info' => 'ℹ️ Инфо', 'promo' => '🎁 Промо',
                        'urgent' => '⚡ Срочное', 'horoscope' => '🔮 Гороскоп',
                        default => $state,
                    })
                    ->color(fn ($state) => match ($state) {
                        'urgent' => 'danger', 'promo' => 'success',
                        'horoscope' => 'warning', default => 'gray',
                    }),
                Tables\Columns\IconColumn::make('is_active')->label('Активно')->boolean(),
                Tables\Columns\IconColumn::make('show_once')->label('1 раз')->boolean(),
                Tables\Columns\TextColumn::make('starts_at')->label('Начало')->dateTime('d.m H:i')->placeholder('—'),
                Tables\Columns\TextColumn::make('ends_at')->label('Конец')->dateTime('d.m H:i')->placeholder('∞'),
                Tables\Columns\TextColumn::make('created_at')->label('Создано')->dateTime('d.m H:i')->sortable(),
            ])
            ->defaultSort('priority', 'desc')
            ->actions([
                Tables\Actions\Action::make('toggle_active')
                    ->label(fn ($record) => $record->is_active ? '⏸ Отключить' : '▶ Включить')
                    ->color(fn ($record) => $record->is_active ? 'warning' : 'success')
                    ->action(function ($record) {
                        $record->update(['is_active' => !$record->is_active]);
                        Notification::make()->title($record->is_active ? 'Popup включён' : 'Popup отключён')->success()->send();
                    }),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array { return []; }
    public static function getPages(): array {
        return [
            'index' => Pages\ListPopupNotifications::route('/'),
            'create' => Pages\CreatePopupNotification::route('/create'),
            'edit' => Pages\EditPopupNotification::route('/{record}/edit'),
        ];
    }
}
