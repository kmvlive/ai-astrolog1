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
            'welcome_title' => config('popup.welcome_title'),
            'welcome_body' => config('popup.welcome_body'),
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('Текст приветствия')
                    ->description('Показывается новым пользователям один раз при первом входе')
                    ->schema([
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
                    ]),

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

        // Сохраняем в .env
        $envPath = base_path('.env');
        $env = File::get($envPath);

        $title = str_replace('"', '\"', $data['welcome_title']);
        $body = str_replace('"', '\"', $data['welcome_body']);

        if (str_contains($env, 'POPUP_WELCOME_TITLE=')) {
            $env = preg_replace('/POPUP_WELCOME_TITLE=.*/', 'POPUP_WELCOME_TITLE="' . $title . '"', $env);
        } else {
            $env .= "\nPOPUP_WELCOME_TITLE=\"" . $title . "\"\n";
        }

        if (str_contains($env, 'POPUP_WELCOME_BODY=')) {
            $env = preg_replace('/POPUP_WELCOME_BODY=.*/', 'POPUP_WELCOME_BODY="' . $body . '"', $env);
        } else {
            $env .= "POPUP_WELCOME_BODY=\"" . $body . "\"\n";
        }

        File::put($envPath, $env);

        // Сбрасываем кэш конфига
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
