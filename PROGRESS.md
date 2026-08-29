# AI Астролог — Статус проекта

## Дата: 30 августа 2026
## Сервер: msk-1-vm-x9bt (Ubuntu)
## Путь: /var/www/ai-astrolog1

## ✅ Что готово

### Архитектура
- Backend: Laravel 12 + PostgreSQL 16 + Redis (Docker)
- Frontend: Next.js 15 + Tailwind (Docker)
- Домен: my.neiro-astro.ru (HTTPS через nginx)
- AI: Timeweb AI (Qwen 3.5 Flash)
- Email: UniSender Go (transactional API)

### Функции
1. **SEO-портал** `/horoscopes`
   - 12 знаков зодиака
   - 5 типов: general, love, career, financial, health
   - 5 периодов: today, tomorrow, week, month, year
   - Ленивая генерация через ИИ

2. **Лендинг** `/`
   - Hero с интерактивом "Узнай свой знак"
   - Быстрые ссылки на периоды
   - Сетка 12 знаков
   - Секции: Как работает / Преимущества / Тарифы

3. **Регистрация + натальная карта**
   - Email + пароль
   - Профиль: дата/время/город рождения
   - Swiss Ephemeris через Python-сервис (порт 8003)

4. **Персональные ИИ-гороскопы** (Dashboard `/dashboard`)
   - 5 типов
   - Натальная карта с планетами в домах

5. **Email-рассылка**
   - UniSender Go API (goapi.unisender.ru)
   - Ключ: 6z7cio4yqpaws6gsyzx93p15id1xmhimzezgedfy
   - From: no-reply@my.neiro-astro.ru (подтверждён)
   - Ежедневно в 08:00

6. **Управление подписками** (в дашборде)
   - `SubscriptionController` + `SubscriptionSettings` компонент
   - Каналы: Email / Telegram / MAX (таблицы `channels`, `user_channels`)
   - Типы: daily / weekly / monthly / yearly / love / finance (таблицы `horoscope_types`, `user_horoscope_types`)
   - Подписки: `subscriptions` (status: trial/active, trial_ends_at)

### Cron (crontab)

## 🎯 Что дальше

### Приоритет 1: Платежи (Тинькофф Эквайринг / Тбанк)
- Терминал: нужно получить Terminal Key + Password
- Рекуррентные платежи 299 ₽/мес после триала
- Страница `/pricing`
- Webhook для продления подписки
- Email "Завтра спишется 299 ₽" за 1 день

### Приоритет 2
- 📱 Telegram-бот (альтернативный канал)
- 📊 История гороскопов на дашборде
- 🎯 Настоящие транзиты планет

## 🔑 Ключевые файлы

- `backend/app/Services/AiService.php` — генерация через Timeweb AI
- `backend/app/Services/UniSenderService.php` — отправка писем
- `backend/app/Console/Commands/GenerateDailyHoroscopes.php`
- `backend/app/Console/Commands/SendDailyHoroscopeEmails.php`
- `backend/app/Http/Controllers/Api/SubscriptionController.php`
- `backend/app/Http/Controllers/Api/DailyHoroscopeController.php`
- `frontend/src/components/SubscriptionSettings.tsx`
- `frontend/src/app/page.tsx` — лендинг
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/horoscopes/[slug]/page.tsx`

## 🗄 Ключевые таблицы БД

- `users` (+ `email_opt_in`)
- `user_profiles` (birth_date, birth_time, city, lat, lng, daily_horoscope_type, daily_horoscope_time)
- `daily_horoscopes` (date, zodiac_sign, type, period, content)
- `subscriptions` (status, trial_ends_at, expires_at, tbank_payment_id)
- `channels` / `user_channels` (email, telegram, max)
- `horoscope_types` / `user_horoscope_types` (daily, weekly, ...)

## 🧪 Тестовые аккаунты
- `artkmv1@yandex.ru` — с подпиской, канал email, тип daily, birth=1990-07-15
- `ivan_test@test.ru` — с подпиской (но email в suppression UniSender)
