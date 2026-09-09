<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\DeliveryLogResource\Pages;
use App\Filament\Admin\Resources\DeliveryLogResource\RelationManagers;
use App\Models\DeliveryLog;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DeliveryLogResource extends Resource
{
    protected static ?string $model = DeliveryLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required(),
                Forms\Components\Select::make('channel_id')
                    ->relationship('channel', 'name')
                    ->required(),
                Forms\Components\Select::make('generated_horoscope_id')
                    ->relationship('generatedHoroscope', 'id')
                    ->required(),
                Forms\Components\TextInput::make('status')
                    ->required()
                    ->maxLength(255),
                Forms\Components\Textarea::make('error_message')
                    ->columnSpanFull(),
                Forms\Components\DateTimePicker::make('sent_at'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('channel.name')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('generatedHoroscope.id')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->searchable(),
                Tables\Columns\TextColumn::make('sent_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDeliveryLogs::route('/'),
            'create' => Pages\CreateDeliveryLog::route('/create'),
            'edit' => Pages\EditDeliveryLog::route('/{record}/edit'),
        ];
    }
}
