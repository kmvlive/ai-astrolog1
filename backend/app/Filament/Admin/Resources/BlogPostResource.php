<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\BlogPostResource\Pages;
use App\Models\BlogPost;
use App\Services\AiService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class BlogPostResource extends Resource
{
    protected static ?string $model = BlogPost::class;
    protected static ?string $navigationIcon = 'heroicon-o-newspaper';
    protected static ?string $navigationLabel = 'Блог';
    protected static ?string $modelLabel = 'Статья';
    protected static ?string $pluralModelLabel = 'Статьи блога';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Основное')
                ->schema([
                    Forms\Components\TextInput::make('title')
                        ->label('Заголовок')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn (string $operation, $state, Forms\Set $set) => 
                            $operation === 'create' ? $set('slug', Str::slug($state)) : null
                        ),
                    Forms\Components\TextInput::make('slug')
                        ->label('URL-адрес')
                        ->required()
                        ->maxLength(255)
                        ->unique(ignoreRecord: true)
                        ->prefix('/blog/'),
                    Forms\Components\Textarea::make('excerpt')
                        ->label('Краткое описание (для списка и SEO)')
                        ->rows(2)
                        ->maxLength(500),
                    Forms\Components\MarkdownEditor::make('content')
                        ->label('Текст статьи (Markdown)')
                        ->required()
                        ->columnSpanFull(),
                ])->columns(2),

            Forms\Components\Section::make('Публикация')
                ->schema([
                    Forms\Components\Select::make('author_type')
                        ->label('Автор')
                        ->options(['ai' => '🤖 AI-астролог', 'human' => '👤 Редактор'])
                        ->required()
                        ->default('ai'),
                    Forms\Components\TextInput::make('author_name')
                        ->label('Имя автора (если человек)')
                        ->maxLength(100),
                    Forms\Components\DateTimePicker::make('published_at')
                        ->label('Дата публикации')
                        ->helperText('Оставьте пустым для черновика'),
                ])->columns(3),

            Forms\Components\Section::make('SEO')
                ->schema([
                    Forms\Components\TextInput::make('seo_title')
                        ->label('SEO-заголовок (для поисковиков)')
                        ->maxLength(70),
                    Forms\Components\Textarea::make('seo_description')
                        ->label('SEO-описание')
                        ->rows(2)
                        ->maxLength(160),
                ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->label('Заголовок')
                    ->searchable()
                    ->sortable()
                    ->limit(50),
                Tables\Columns\TextColumn::make('author_type')
                    ->label('Автор')
                    ->badge()
                    ->formatStateUsing(fn ($state) => $state === 'ai' ? '🤖 AI' : '👤 Редактор')
                    ->color(fn ($state) => $state === 'ai' ? 'primary' : 'success'),
                Tables\Columns\TextColumn::make('published_at')
                    ->label('Опубликовано')
                    ->dateTime('d M Y')
                    ->placeholder('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('views_count')
                    ->label('👁')
                    ->sortable(),
                Tables\Columns\IconColumn::make('status')
                    ->label('Статус')
                    ->boolean()
                    ->getStateUsing(fn ($record) => $record->published_at && $record->published_at->isPast()),
            ])
            ->defaultSort('published_at', 'desc')
            ->actions([
                Tables\Actions\Action::make('new_cover')
                    ->label('🎨 Новая обложка')
                    ->color('gray')
                    ->action(function ($record) {
                        $old = $record->cover_image;
                        $cover = app(\App\Services\AiService::class)->generateCover($record);
                        if ($cover) {
                            $record->update(['cover_image' => $cover]);
                            if ($old && $old !== $cover) \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
                        }
                        \Filament\Notifications\Notification::make()->title('Обложка обновлена — обновите страницу блога')->success()->send();
                    }),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('view')
                    ->label('Открыть')
                    ->icon('heroicon-o-eye')
                    ->url(fn ($record) => $record->published_at ? route('blog.show', $record) : null)
                    ->openUrlInNewTab()
                    ->visible(fn ($record) => $record->published_at && $record->published_at->isPast()),
            ])
            ->headerActions([
                Tables\Actions\Action::make('generate_ai')
                    ->label('✨ Сгенерировать ИИ-статью')
                    ->icon('heroicon-o-sparkles')
                    ->color('primary')
                    ->requiresConfirmation()
                    ->action(function () {
                        $ai = app(AiService::class);
                        $post = $ai->generateBlogPost();
                        if ($post) {
                            Notification::make()
                                ->title('Статья сгенерирована!')
                                ->body("«{$post->title}» — откройте для редактирования")
                                ->success()
                                ->send();
                        } else {
                            Notification::make()
                                ->title('Ошибка генерации')
                                ->danger()
                                ->send();
                        }
                    }),
            ]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBlogPosts::route('/'),
            'create' => Pages\CreateBlogPost::route('/create'),
            'edit' => Pages\EditBlogPost::route('/{record}/edit'),
        ];
    }
}
