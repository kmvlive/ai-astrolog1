<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\CounterResource\Pages;
use App\Models\Counter;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CounterResource extends Resource
{
    protected static ?string $model = Counter::class;

    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationLabel = 'Счётчики';

    protected static ?string $label = 'Счётчик';

    protected static ?string $pluralLabel = 'Счётчики';

    protected static ?int $navigationSort = 10;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')
                ->label('Название')
                ->placeholder('Яндекс.Метрика / Google Analytics')
                ->required(),
            Forms\Components\Select::make('type')
                ->label('Тип')
                ->options([
                    'yandex' => 'Яндекс.Метрика',
                    'google' => 'Google Analytics (gtag)',
                    'custom' => 'Произвольный код',
                ])
                ->default('yandex')
                ->required()
                ->live(),
            Forms\Components\TextInput::make('code')
                ->label('ID счётчика')
                ->helperText('Метрика: номер, напр. 12345678. Google: G-XXXXXXX.')
                ->hidden(fn (Forms\Get $get) => $get('type') === 'custom'),
            Forms\Components\Textarea::make('raw_code')
                ->label('Произвольный код')
                ->rows(8)
                ->helperText('Полный сниппет со <script>…</script> или чистый JS')
                ->hidden(fn (Forms\Get $get) => $get('type') !== 'custom'),
            Forms\Components\Toggle::make('is_active')
                ->label('Активен')
                ->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->label('Название')->searchable(),
                Tables\Columns\TextColumn::make('type')->label('Тип')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'yandex' => 'Яндекс.Метрика',
                        'google' => 'Google Analytics',
                        'custom' => 'Свой код',
                        default => $state,
                    })
                    ->badge(),
                Tables\Columns\TextColumn::make('code')->label('ID'),
                Tables\Columns\ToggleColumn::make('is_active')->label('Активен'),
                Tables\Columns\TextColumn::make('updated_at')->label('Обновлён')->dateTime('d.m.Y H:i'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
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
            'index' => Pages\ListCounters::route('/'),
            'create' => Pages\CreateCounter::route('/create'),
            'edit' => Pages\EditCounter::route('/{record}/edit'),
        ];
    }
}
