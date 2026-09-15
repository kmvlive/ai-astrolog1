<?php

namespace App\Filament\Admin\Pages;

use App\Models\User;
use Filament\Actions\Action;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\File;

class WelcomePopupSettings extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';
    protected static ?string $navigationLabel = 'Приветственный popup';
    protected static ?string $title = 'Приветственный popup';
    protected static ?string $navigationGroup = 'Уведомления';
    protected static ?int $navigationSort = 2;
    protected static string $view = 'filament.admin.pages.welcome-popup-settings';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'welcome_icon' => config('popup.welcome_icon', '✨'),
            'welcome_title' => config('popup.welcome_title'),
            'welcome_body' => config('popup.welcome_body'),
            'welcome_link_url' => config('popup.welcome_link_url', '/dashboard'),
            'welcome_link_text' => config('popup.welcome_link_text', 'Начать'),
            'welcome_dismiss_text' => config('popup.welcome_dismiss_text', 'Позже'),
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('Содержание')
                    ->description('Показывается новым пользователям один раз при первом входе')
                    ->schema([
                        TextInput::make('welcome_icon')
                            ->label('Иконка (эмодзи)')
                            ->default('✨')
                            ->maxLength(10),
                        TextInput::make('welcome_title')
                            ->label('Заголовок')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Добро пожаловать в AI Астролог! 🌟'),
                        Textarea::make('welcome_body')
                            ->label('Текст')
                            ->required()
                            ->rows(8)
                            ->placeholder("Здесь вы найдёте:\n\n🔮 Персональные гороскопы..."),
                    ])->columns(2),

                Section::make('Кнопки')
                    ->schema([
                        TextInput::make('welcome_link_url')
                            ->label('URL ссылки')
                            ->placeholder('/dashboard или https://...')
                            ->helperText('Оставьте пустым чтобы скрыть кнопку'),
                        TextInput::make('welcome_link_text')
                            ->label('Текст кнопки ссылки')
                            ->default('Начать')
                            ->maxLength(50),
                        TextInput::make('welcome_dismiss_text')
                            ->label('Текст кнопки закрытия')
                            ->default('Позже')
                            ->maxLength(50),
                    ])->columns(3),

                Section::make('Предпросмотр')
                    ->schema([
                        \Filament\Forms\Components\View::make('filament.admin.components.welcome-preview'),
                    ])->collapsible(),

                Section::make('Статистика')
                    ->schema([
                        \Filament\Forms\Components\Placeholder::make('stats')
                            ->label('')
                            ->content(function () {
                                $total = User::count();
                                $shown = User::where('welcome_popup_shown', true)->count();
                                $pending = $total - $shown;
                                return view('filament.admin.components.welcome-stats', compact('total', 'shown', 'pending'));
                            }),
                    ]),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        $envPath = base_path('.env');
        $env = File::get($envPath);

        $fields = [
            'POPUP_WELCOME_ICON' => $data['welcome_icon'] ?? '✨',
            'POPUP_WELCOME_TITLE' => $data['welcome_title'],
            'POPUP_WELCOME_BODY' => $data['welcome_body'],
            'POPUP_WELCOME_LINK_URL' => $data['welcome_link_url'] ?? '',
            'POPUP_WELCOME_LINK_TEXT' => $data['welcome_link_text'] ?? 'Начать',
            'POPUP_WELCOME_DISMISS_TEXT' => $data['welcome_dismiss_text'] ?? 'Позже',
        ];

        foreach ($fields as $key => $value) {
            $escaped = str_replace('"', '\"', $value ?? '');
            if (str_contains($env, "{$key}=")) {
                $env = preg_replace('/' . preg_quote($key, '/') . '=.*/', "{$key}=\"{$escaped}\"", $env);
            } else {
                $env .= "\n{$key}=\"{$escaped}\"\n";
            }
        }

        File::put($envPath, $env);
        \Artisan::call('config:clear');

        Notification::make()
            ->title('Приветственный popup обновлён')
            ->success()
            ->send();
    }

    public function resetAllAction(): Action
    {
        return Action::make('resetAll')
            ->label('Сбросить для всех пользователей')
            ->color('danger')
            ->icon('heroicon-o-arrow-path')
            ->requiresConfirmation()
            ->modalHeading('Сбросить приветственный popup?')
            ->modalDescription('Все пользователи увидят приветствие заново. Продолжить?')
            ->action(function () {
                User::query()->update(['welcome_popup_shown' => false]);
                Notification::make()
                    ->title('Сброшено для ' . User::count() . ' пользователей')
                    ->success()
                    ->send();
            });
    }

    protected function getFormActions(): array
    {
        return [
            Action::make('save')
                ->label('Сохранить')
                ->submit('save')
                ->color('primary'),
            $this->resetAllAction(),
        ];
    }
}
