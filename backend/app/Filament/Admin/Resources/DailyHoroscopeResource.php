<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\DailyHoroscopeResource\Pages;
use App\Filament\Admin\Resources\DailyHoroscopeResource\RelationManagers;
use App\Models\DailyHoroscope;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DailyHoroscopeResource extends Resource
{
    protected static ?string $model = DailyHoroscope::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\DatePicker::make('date')
                    ->required(),
                Forms\Components\TextInput::make('zodiac_sign')
                    ->required()
                    ->maxLength(10),
                Forms\Components\TextInput::make('type')
                    ->required()
                    ->maxLength(255)
                    ->default('general'),
                Forms\Components\Textarea::make('content')
                    ->required()
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('period')
                    ->required()
                    ->maxLength(255)
                    ->default('today'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('date')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('zodiac_sign')
                    ->searchable(),
                Tables\Columns\TextColumn::make('type')
                    ->searchable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('period')
                    ->searchable(),
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
            'index' => Pages\ListDailyHoroscopes::route('/'),
            'create' => Pages\CreateDailyHoroscope::route('/create'),
            'edit' => Pages\EditDailyHoroscope::route('/{record}/edit'),
        ];
    }
}
