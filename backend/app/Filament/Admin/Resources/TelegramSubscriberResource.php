<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\TelegramSubscriberResource\Pages;
use App\Models\TelegramSubscriber;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TelegramSubscriberResource extends Resource
{
    protected static ?string $model = TelegramSubscriber::class;

    protected static ?string $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Telegram подписчики';

    protected static ?string $label = 'Подписчик';

    protected static ?string $pluralLabel = 'Telegram подписчики';

    protected static ?int $navigationSort = 11;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.email')->label('Email')->searchable(),
                Tables\Columns\TextColumn::make('username')->label('Username')->searchable(),
                Tables\Columns\TextColumn::make('first_name')->label('Имя'),
                Tables\Columns\TextColumn::make('chat_id')->label('Chat ID'),
                Tables\Columns\ToggleColumn::make('is_active')->label('Активен'),
                Tables\Columns\TextColumn::make('last_sent_at')->label('Последняя отправка')->dateTime('d.m.Y H:i'),
            ])
            ->actions([
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTelegramSubscribers::route('/'),
        ];
    }
}
