<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\FooterMenuItemResource\Pages;
use App\Models\FooterMenuItem;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class FooterMenuItemResource extends Resource
{
    protected static ?string $model = FooterMenuItem::class;
    
    protected static ?string $navigationIcon = 'heroicon-o-bars-3-bottom-left';
    protected static ?string $navigationLabel = 'Нижнее меню';
    protected static ?string $modelLabel = 'пункт меню';
    protected static ?string $pluralModelLabel = 'Нижнее меню';
    protected static ?int $navigationSort = 90;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основное')
                    ->schema([
                        Forms\Components\TextInput::make('title')
                            ->label('Название')
                            ->required()
                            ->maxLength(100),
                        Forms\Components\TextInput::make('url')
                            ->label('URL (ссылка)')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('/names или https://...'),
                    ])->columns(2),
                
                Forms\Components\Section::make('Настройки')
                    ->schema([
                        Forms\Components\TextInput::make('sort_order')
                            ->label('Порядок сортировки')
                            ->numeric()
                            ->default(0)
                            ->helperText('Меньше число = выше в списке'),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Активно')
                            ->default(true),
                        Forms\Components\Toggle::make('open_in_new_tab')
                            ->label('Открывать в новой вкладке')
                            ->default(false),
                    ])->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('sort_order')
                    ->label('Порядок')
                    ->sortable()
                    ->width(80),
                Tables\Columns\TextColumn::make('title')
                    ->label('Название')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('url')
                    ->label('URL')
                    ->searchable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Активно')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\IconColumn::make('open_in_new_tab')
                    ->label('Новая вкладка')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Обновлено')
                    ->dateTime('d.m.Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order', 'asc')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Активно'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\BulkAction::make('activate')
                        ->label('Активировать')
                        ->action(fn ($records) => $records->each->update(['is_active' => true])),
                    Tables\Actions\BulkAction::make('deactivate')
                        ->label('Деактивировать')
                        ->action(fn ($records) => $records->each->update(['is_active' => false])),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListFooterMenuItems::route('/'),
            'create' => Pages\CreateFooterMenuItem::route('/create'),
            'edit' => Pages\EditFooterMenuItem::route('/{record}/edit'),
        ];
    }
}
