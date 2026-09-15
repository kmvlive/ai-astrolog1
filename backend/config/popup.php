<?php

return [
    'welcome_title' => env('POPUP_WELCOME_TITLE', 'Добро пожаловать в AI Астролог! 🌟'),
    'welcome_body' => env('POPUP_WELCOME_BODY', "Здесь вы найдёте:\n\n🔮 Персональные гороскопы по натальной карте\n🌙 Лунные календари на каждый день\n🃏 Гадания на Таро и рунах\n💫 Ежедневные аффирмации\n\nИсследуйте все возможности — звёзды ждут вас!"),
    'welcome_icon' => env('POPUP_WELCOME_ICON', '✨'),
    'welcome_link_url' => env('POPUP_WELCOME_LINK_URL', '/dashboard'),
    'welcome_link_text' => env('POPUP_WELCOME_LINK_TEXT', 'Начать'),
    'welcome_dismiss_text' => env('POPUP_WELCOME_DISMISS_TEXT', 'Позже'),
];
