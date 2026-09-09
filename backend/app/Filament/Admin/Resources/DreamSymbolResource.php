<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\DreamSymbolResource\Pages;
use App\Models\DreamSymbol;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class DreamSymbolResource extends Resource
{
    protected static ?string $model = DreamSymbol::class;
    protected static ?string $navigationIcon = 'heroicon-o-moon';
    protected static ?string $navigationLabel = 'Сонник';
    protected static ?string $modelLabel = 'толкование';
    protected static ?string $pluralModelLabel = 'Сонник';

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('keyword')->label('Слово')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('interpretation')->label('Толкование')->limit(80),
                Tables\Columns\IconColumn::make('ai_generated')->label('AI')->boolean(),
                Tables\Columns\ToggleColumn::make('approved')->label('На сайте'),
                Tables\Columns\TextColumn::make('views')->label('Просмотры')->sortable(),
                Tables\Columns\TextColumn::make('created_at')->label('Создано')->date('d.m.Y'),
            ])
            ->filters([
                Tables\Filters\Filter::make('pending')
                    ->label('Только на модерации')
                    ->query(fn (Builder $query) => $query->where('approved', false))
                    ->default(true),
                Tables\Filters\Filter::make('approved')
                    ->label('Одобренные (на сайте)')
                    ->query(fn (Builder $query) => $query->where('approved', true)),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->label('Одобрить')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (DreamSymbol $record) => !$record->approved)
                    ->action(fn (DreamSymbol $record) => $record->update(['approved' => true])),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('approve')
                        ->label('Одобрить выбранные')
                        ->icon('heroicon-o-check-circle')
                        ->action(fn ($records) => $records->each->update(['approved' => true])),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDreamSymbols::route('/'),
        ];
    }
}
