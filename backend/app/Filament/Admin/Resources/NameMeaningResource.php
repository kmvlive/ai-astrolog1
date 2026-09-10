<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\NameMeaningResource\Pages;
use App\Models\NameMeaning;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class NameMeaningResource extends Resource
{
    protected static ?string $model = NameMeaning::class;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';
    
    protected static ?string $navigationLabel = 'Значения имён';
    
    protected static ?string $modelLabel = 'имя';
    
    protected static ?string $pluralModelLabel = 'значения имён';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основное')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Имя')
                            ->required()
                            ->maxLength(100),
                        Forms\Components\TextInput::make('translit')
                            ->label('Транслит (URL)')
                            ->required()
                            ->maxLength(100)
                            ->unique(ignoreRecord: true),
                        Forms\Components\Select::make('origin')
                            ->label('Происхождение')
                            ->options([
                                'славянское' => 'Славянское',
                                'греческое' => 'Греческое',
                                'еврейское' => 'Еврейское',
                                'латинское' => 'Латинское',
                                'германское' => 'Германское',
                                'арабское' => 'Арабское',
                                'тюркское' => 'Тюркское',
                                'скандинавское' => 'Скандинавское',
                                'кельтское' => 'Кельтское',
                                'персидское' => 'Персидское',
                                'индийское' => 'Индийское',
                            ])
                            ->searchable()
                            ->nullable(),
                    ])->columns(2),
                
                Forms\Components\Section::make('Толкование')
                    ->schema([
                        Forms\Components\Textarea::make('interpretation')
                            ->label('Текст толкования')
                            ->required()
                            ->rows(15)
                            ->columnSpanFull(),
                    ]),
                
                Forms\Components\Section::make('Мета')
                    ->schema([
                        Forms\Components\Toggle::make('approved')
                            ->label('Одобрено (публикуется)')
                            ->default(true),
                        Forms\Components\Toggle::make('ai_generated')
                            ->label('Сгенерировано AI')
                            ->disabled()
                            ->dehydrated(),
                        Forms\Components\TextInput::make('views')
                            ->label('Просмотры')
                            ->numeric()
                            ->disabled()
                            ->dehydrated()
                            ->default(0),
                    ])->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Имя')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('origin')
                    ->label('Происхождение')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'славянское' => 'success',
                        'греческое' => 'info',
                        'еврейское' => 'warning',
                        'латинское' => 'danger',
                        'германское' => 'primary',
                        default => 'gray',
                    })
                    ->searchable(),
                Tables\Columns\IconColumn::make('approved')
                    ->label('Одобрено')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\IconColumn::make('ai_generated')
                    ->label('AI')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\TextColumn::make('views')
                    ->label('👁')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Обновлено')
                    ->dateTime('d.m.Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('origin')
                    ->label('Происхождение')
                    ->options([
                        'славянское' => 'Славянское',
                        'греческое' => 'Греческое',
                        'еврейское' => 'Еврейское',
                        'латинское' => 'Латинское',
                        'германское' => 'Германское',
                        'арабское' => 'Арабское',
                    ]),
                Tables\Filters\TernaryFilter::make('approved')
                    ->label('Одобрено'),
                Tables\Filters\TernaryFilter::make('ai_generated')
                    ->label('AI-генерация'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('view')
                    ->label('Открыть')
                    ->url(fn (NameMeaning $record): string => "https://my.neiro-astro.ru/names/{$record->translit}")
                    ->openUrlInNewTab()
                    ->icon('heroicon-o-arrow-top-right-on-square'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\BulkAction::make('approve')
                        ->label('Одобрить')
                        ->action(fn ($records) => $records->each->update(['approved' => true]))
                        ->successNotificationTitle('Имена одобрены'),
                    Tables\Actions\BulkAction::make('unapprove')
                        ->label('Снять одобрение')
                        ->action(fn ($records) => $records->each->update(['approved' => false]))
                        ->successNotificationTitle('Одобрение снято'),
                ]),
            ])
            ->defaultSort('name', 'asc')
            ->paginated([25, 50, 100]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListNameMeanings::route('/'),
            'create' => Pages\CreateNameMeaning::route('/create'),
            'edit' => Pages\EditNameMeaning::route('/{record}/edit'),
        ];
    }
    
    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::whereNull('origin')->count() ?: null;
    }
    
    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
