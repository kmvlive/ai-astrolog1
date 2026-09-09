<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\AdResource\Pages;
use App\Models\Ad;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class AdResource extends Resource
{
    protected static ?string $model = Ad::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';
    protected static ?string $navigationLabel = 'Реклама';
    protected static ?string $pluralModelLabel = 'Рекламные места';
    protected static ?string $modelLabel = 'Рекламное место';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('title')
                    ->label('Заголовок')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Хотите персональный гороскоп?'),
                
                Forms\Components\Textarea::make('description')
                    ->label('Описание')
                    ->required()
                    ->rows(3)
                    ->placeholder('На основе вашей натальной карты — 10 планет, 12 домов...'),
                
                Forms\Components\TextInput::make('cta_text')
                    ->label('Текст кнопки')
                    ->required()
                    ->default('Подробнее')
                    ->maxLength(50),
                
                Forms\Components\TextInput::make('cta_url')
                    ->label('Ссылка кнопки')
                    ->required()
                    ->url()
                    ->placeholder('https://my.neiro-astro.ru/pricing'),
                
                Forms\Components\Grid::make(2)
                    ->schema([
                        Forms\Components\Select::make('gradient_from')
                            ->label('Градиент от')
                            ->options([
                                'from-violet-900/30' => 'Фиолетовый',
                                'from-purple-900/30' => 'Пурпурный',
                                'from-indigo-900/30' => 'Индиго',
                                'from-blue-900/30' => 'Синий',
                                'from-cyan-900/30' => 'Голубой',
                                'from-emerald-900/30' => 'Изумрудный',
                                'from-amber-900/30' => 'Янтарный',
                                'from-rose-900/30' => 'Розовый',
                            ])
                            ->default('from-violet-900/30')
                            ->required(),
                        
                        Forms\Components\Select::make('gradient_to')
                            ->label('Градиент до')
                            ->options([
                                'to-indigo-900/30' => 'Индиго',
                                'to-purple-900/30' => 'Пурпурный',
                                'to-violet-900/30' => 'Фиолетовый',
                                'to-blue-900/30' => 'Синий',
                                'to-cyan-900/30' => 'Голубой',
                                'to-emerald-900/30' => 'Изумрудный',
                                'to-amber-900/30' => 'Янтарный',
                                'to-rose-900/30' => 'Розовый',
                            ])
                            ->default('to-indigo-900/30')
                            ->required(),
                    ]),
                
                Forms\Components\TextInput::make('emoji')
                    ->label('Эмодзи')
                    ->default('✨')
                    ->maxLength(10)
                    ->helperText('Один эмодзи для заголовка'),
                
                Forms\Components\Toggle::make('is_active')
                    ->label('Активно')
                    ->default(true)
                    ->required(),
                
                Forms\Components\TextInput::make('sort_order')
                    ->label('Порядок сортировки')
                    ->numeric()
                    ->default(0)
                    ->helperText('Меньше число = выше в списке'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('emoji')
                    ->label('')
                    ->size('text-2xl'),
                
                Tables\Columns\TextColumn::make('title')
                    ->label('Заголовок')
                    ->searchable()
                    ->limit(50),
                
                Tables\Columns\TextColumn::make('cta_text')
                    ->label('Кнопка')
                    ->badge()
                    ->color('primary'),
                
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Активно')
                    ->boolean(),
                
                Tables\Columns\TextColumn::make('sort_order')
                    ->label('Порядок')
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Создано')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order', 'asc')
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
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAds::route('/'),
            'create' => Pages\CreateAd::route('/create'),
            'edit' => Pages\EditAd::route('/{record}/edit'),
        ];
    }
}
