Конечно! Вот единый файл с полным техническим заданием. Сохраните его как `tz_astro_service.md` (или `.txt`) и скормите Qwen Coder — он сможет сразу приступить к работе, задавая уточняющие вопросы по ходу.

---

```markdown
# ТЕХНИЧЕСКОЕ ЗАДАНИЕ
## AI-сервис персональных и общих гороскопов
**Версия:** 1.0
**Дата:** 27.08.2026
**Заказчик:** [Ваше имя/компания]
**Исполнитель:** Qwen Coder

---

## 0. ИНСТРУКЦИЯ ДЛЯ QWEN CODER

При работе над этим ТЗ следуй следующим правилам:

1. **Не начинай писать код сразу.** Сначала прочитай всё ТЗ целиком, задай уточняющие вопросы (если есть), предложи архитектурные решения и согласуй план работы по фазам.
2. **Работай итеративно по фазам** (раздел 12). Каждую фазу разбивай на подзадачи, согласовывай с заказчиком, пиши код, покрывай тестами, деплои.
3. **Коммить по Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
4. **Документируй ключевые решения** в `docs/decisions/` (ADR — Architecture Decision Records).
5. **Не отклоняйся от стека** без веских причин. Если предлагаешь альтернативу — обоснуй.
6. **Каждый внешний вызов** (Timeweb AI, Т-Банк, UniSender, Telegram, MAX, Python-сервис) — через сервис-классы с retry, таймаутом, логированием.
7. **Все секреты** — только через `.env`, никаких хардкодов.

---

## 1. ОБЩЕЕ ОПИСАНИЕ ПРОЕКТА

### 1.1. Суть сервиса
Веб-сервис, который генерирует гороскопы с помощью AI (через Timeweb AI API). Пользователь регистрируется, вводит данные рождения, выбирает интересующие типы гороскопов и получает их на email / Telegram / MAX.

**Два уровня контента:**
- **Общие гороскопы** (бесплатно) — генерируются по знаку зодиака. Типы: общий, любовный, карьерный, финансовый, здоровье, китайский, тибетский. Новые типы можно добавлять из админки.
- **Индивидуальный гороскоп** (по подписке) — генерируется на основе натальной карты (дата, время, место рождения) с расчётом асцендента, лунного знака, положения планет. Обновляется раз в 2 недели (настраивается из админки).

### 1.2. Бизнес-модель
- Общие гороскопы — бесплатно (монетизация через рекламу на генерируемых страницах).
- Индивидуальный — платная подписка с рекуррентными платежами.
- Триал: 7 дней бесплатного индивидуального гороскопа (неполная версия в рассылке, полная — на генерируемой странице).
- Через 7 дней триал заканчивается → предложение оформить подписку.

### 1.3. Ключевые правила подписки
1. При активации платной подписки на индивидуальный гороскоп **общие рассылки автоматически приостанавливаются**. В личном кабинете показывается уведомление об этом.
2. Пользователь может **вручную включить** общие гороскопы обратно (галочки + кнопка «Сохранить»), даже имея активную подписку на индивидуальный.
3. При **окончании подписки** на индивидуальный автоматически **восстанавливаются** те общие гороскопы, которые были активны до подключения подписки.
4. Рекуррентные платежи через Т-Банк. Частоты подписки (раз в неделю / 2 недели / месяц) настраиваются из админки.

### 1.4. Каналы доставки
| Канал | Статус | Примечание |
|---|---|---|
| Email (UniSender) | Основной, всегда | Обязателен для всех пользователей |
| Telegram | Опциональный | Пользователь подключает сам |
| MAX | Опциональный | Пользователь подключает сам |

### 1.5. Генерируемые страницы
- Каждый гороскоп имеет уникальную публичную страницу с полным текстом.
- Страница содержит рекламные блоки (категории настраиваются из админки).
- Страница имеет **срок жизни (TTL)**: ежедневные гороскопы — 24 часа, еженедельные — 7 дней, индивидуальный — 14 дней (настраивается).
- После истечения TTL страница показывает заглушку: «Гороскоп устарел» + кнопка в личный кабинет.
- Страницы должны индексироваться поисковиками (SEO: мета-теги, Open Graph, structured data).

---

## 2. СТЕК ТЕХНОЛОГИЙ

| Компонент | Технология | Версия | Назначение |
|---|---|---|---|
| Backend | **Laravel** | 11.x | API, бизнес-логика, очереди, планировщик |
| Админ-панель | **Filament** | 3.x | Панель управления |
| Frontend (клиент) | **Next.js** | 14.x (App Router) | SSR, PWA, SEO |
| База данных | **PostgreSQL** | 16 | Основное хранилище |
| Кеш / Очереди | **Redis** | 7.x | Очереди, кеш, сессии |
| Натальная карта | **Python + FastAPI + kerykeion** | 3.11+ | Микросервис расчёта |
| Платежи | **Т-Банк (Тинькофф) API** | Рекуррентные | Приём платежей |
| Email-рассылки | **UniSender API** | — | Отправка писем |
| AI-генерация | **Timeweb AI API** | — | Генерация текстов гороскопов |
| Мессенджеры | **Telegram Bot API**, **MAX API** | — | Опциональные каналы |
| Сервер | **Timeweb Cloud VDS** | Ubuntu 22.04+ | Хостинг |
| Веб-сервер | **Nginx** | — | Reverse proxy |
| SSL | **Let's Encrypt** | — | HTTPS |

### Требования к серверу (минимум для старта):
- CPU: 4 ядра
- RAM: 8 GB
- SSD: 80 GB
- Отдельный контейнер/процесс для Python-микросервиса

---

## 3. АРХИТЕКТУРА СИСТЕМЫ

```
┌──────────────────────────────────────────────────────┐
│                    Next.js (Frontend)                 │
│  Публичные страницы │ Личный кабинет │ Генер. стр.   │
└──────────────┬───────────────┬───────────────┬───────┘
               │               │               │
               ▼               ▼               ▼
┌──────────────────────────────────────────────────────┐
│              Laravel API (Backend)                    │
│                                                      │
│  ┌─────────┐ ┌────────────┐ ┌────────────────────┐  │
│  │ Auth    │ │ Subscript. │ │ Horoscope Pages    │  │
│  │ JWT     │ │ Payments   │ │ Generation + TTL   │  │
│  └────┬────┘ └─────┬──────┘ └─────────┬──────────┘  │
│       │            │                   │             │
│  ┌────▼────────────▼───────────────────▼──────────┐  │
│  │            Service Layer (бизнес-логика)       │  │
│  │  TrialManager │ SubscriptionManager │ Generator │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────▼───────────────────────────┐  │
│  │         Queue Workers (Redis + Laravel Queue)   │  │
│  │  SendEmail │ SendTelegram │ SendMax │ GenerateAI│  │
│  └────────────────────────────────────────────────┘  │
│                       │                              │
│  ┌────────────────────▼───────────────────────────┐  │
│  │         Scheduler (Laravel Cron)                │  │
│  │  Генерация │ Рассылка │ Платежи │ Очистка      │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌────────────┐ ┌────────────┐ ┌──────────────────┐
│ PostgreSQL │ │   Redis    │ │ Python FastAPI   │
│            │ │            │ │ Натальные карты  │
└────────────┘ └────────────┘ └──────────────────┘
```

---

## 4. БАЗА ДАННЫХ

### 4.1. Полная схема (миграции)

```sql
-- ============================================
-- ПОЛЬЗОВАТЕЛИ
-- ============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    
    birth_date DATE,
    birth_time TIME,
    birth_city VARCHAR(255),
    birth_country VARCHAR(255) DEFAULT 'Россия',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    
    zodiac_sign VARCHAR(50),
    ascendant VARCHAR(50),
    moon_sign VARCHAR(50),
    natal_data JSONB,
    
    trial_started_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    trial_used BOOLEAN DEFAULT FALSE,
    
    individual_status VARCHAR(20) DEFAULT 'none',
    
    timezone VARCHAR(50) DEFAULT 'Europe/Moscow',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_zodiac ON users(zodiac_sign);
CREATE INDEX idx_users_individual_status ON users(individual_status);

-- ============================================
-- ТИПЫ ГОРОСКОПОВ
-- ============================================
CREATE TABLE horoscope_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    is_individual BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50),
    
    ai_prompt_template TEXT NOT NULL,
    default_frequency VARCHAR(20) DEFAULT 'daily',
    
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO horoscope_types (name, slug, category, is_individual, default_frequency, ai_prompt_template) VALUES
('Общий', 'general', 'general', FALSE, 'daily', 'Ты профессиональный астролог. Составь общий гороскоп для знака {zodiac_sign} на {period}. Стиль: тёплый, поддерживающий. Объём: 150-250 слов. Разделы: настроение дня, ключевые события, совет.'),
('Любовный', 'love', 'love', FALSE, 'daily', 'Ты профессиональный астролог. Составь любовный гороскоп для знака {zodiac_sign} на {period}. Стиль: романтичный, деликатный. Объём: 150-250 слов. Разделы: отношения, чувства, совет для пары/одиноких.'),
('Карьерный', 'career', 'career', FALSE, 'daily', 'Ты профессиональный астролог. Составь карьерный гороскоп для знака {zodiac_sign} на {period}. Стиль: деловой, мотивирующий. Объём: 150-250 слов. Разделы: работа, проекты, отношения с коллегами, совет.'),
('Финансовый', 'financial', 'financial', FALSE, 'daily', 'Ты профессиональный астролог. Составь финансовый гороскоп для знака {zodiac_sign} на {period}. Стиль: практичный, конкретный. Объём: 150-250 слов. Разделы: доходы, расходы, инвестиции, совет. Не давай конкретных финансовых рекомендаций.'),
('Здоровье', 'health', 'health', FALSE, 'daily', 'Ты профессиональный астролог. Составь гороскоп здоровья для знака {zodiac_sign} на {period}. Стиль: заботливый. Объём: 150-250 слов. Разделы: самочувствие, энергия, рекомендации. Не ставь диагнозов, только общие рекомендации по образу жизни.'),
('Китайский', 'chinese', 'chinese', FALSE, 'weekly', 'Ты эксперт по китайской астрологии. Составь гороскоп для знака {chinese_zodiac} на {period}. Учитывай стихи года и циклы. Объём: 200-300 слов.'),
('Тибетский', 'tibetan', 'tibetan', FALSE, 'weekly', 'Ты эксперт по тибетской астрологии. Составь гороскоп для знака {zodiac_sign} на {period}. Учитывай лунные циклы и тибетский календарь. Объём: 200-300 слов.');

-- ============================================
-- ПОДПИСКИ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================
CREATE TABLE user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    horoscope_type_id INT NOT NULL REFERENCES horoscope_types(id),
    frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
    status VARCHAR(20) DEFAULT 'active',
    is_individual BOOLEAN DEFAULT FALSE,
    
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NULL,
    paused_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, horoscope_type_id)
);
CREATE INDEX idx_user_sub_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_sub_status ON user_subscriptions(status);

-- ============================================
-- СНИМКИ СОСТОЯНИЯ ПОДПИСОК
-- ============================================
CREATE TABLE subscription_snapshots (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    reason VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    restored_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_snapshot_user ON subscription_snapshots(user_id) WHERE is_active = TRUE;

-- ============================================
-- КАНАЛЫ ДОСТАВКИ
-- ============================================
CREATE TABLE user_channels (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    external_id VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    subscribed_at TIMESTAMP DEFAULT NOW(),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, channel)
);

-- ============================================
-- СГЕНЕРИРОВАННЫЕ ГОРОСКОПЫ
-- ============================================
CREATE TABLE generated_horoscopes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL REFERENCES users(id),
    horoscope_type_id INT NOT NULL REFERENCES horoscope_types(id),
    zodiac_sign VARCHAR(50) NULL,
    chinese_zodiac VARCHAR(50) NULL,
    
    title VARCHAR(255) NOT NULL,
    content_short TEXT NOT NULL,
    content_full TEXT NOT NULL,
    
    page_slug VARCHAR(255) UNIQUE NOT NULL,
    
    ads_config JSONB DEFAULT '{}',
    
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE,
    
    generation_status VARCHAR(20) DEFAULT 'completed',
    ai_response_raw TEXT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_gen_horoscope_slug ON generated_horoscopes(page_slug);
CREATE INDEX idx_gen_horoscope_valid ON generated_horoscopes(valid_until) WHERE NOT is_expired;
CREATE INDEX idx_gen_horoscope_user ON generated_horoscopes(user_id);
CREATE INDEX idx_gen_horoscope_type ON generated_horoscopes(horoscope_type_id);

-- ============================================
-- ПЛАТЕЖИ
-- ============================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    
    status VARCHAR(20) DEFAULT 'pending',
    
    bank_payment_id VARCHAR(255) UNIQUE,
    recurrent_token VARCHAR(255),
    order_id VARCHAR(255),
    
    subscription_period_start DATE,
    subscription_period_end DATE,
    
    attempt_number INT DEFAULT 1,
    max_attempts INT DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    
    error_message TEXT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP NULL
);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_recurrent ON payments(recurrent_token);

-- ============================================
-- РЕКУРРЕНТНЫЕ ПОДПИСКИ (Т-Банк)
-- ============================================
CREATE TABLE recurrent_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    recurrent_token VARCHAR(255) NOT NULL,
    
    frequency VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    
    status VARCHAR(20) DEFAULT 'active',
    
    next_payment_date DATE NOT NULL,
    last_payment_date DATE NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP NULL
);
CREATE INDEX idx_recurrent_user ON recurrent_subscriptions(user_id);
CREATE INDEX idx_recurrent_next ON recurrent_subscriptions(next_payment_date) WHERE status = 'active';

-- ============================================
-- НАСТРОЙКИ АДМИНКИ
-- ============================================
CREATE TABLE admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO admin_settings (key, value, description) VALUES
('trial_days', '7', 'Количество дней триала'),
('individual_update_interval_days', '14', 'Интервал обновления индивидуального гороскопа (дни)'),
('individual_frequencies', '["weekly", "biweekly", "monthly"]', 'Доступные частоты подписки'),
('individual_prices', '{"weekly": 299, "biweekly": 499, "monthly": 799}', 'Цены по частотам (руб/мес)'),
('page_ttl_daily_hours', '24', 'TTL ежедневных страниц (часы)'),
('page_ttl_weekly_days', '7', 'TTL еженедельных страниц (дни)'),
('page_ttl_individual_days', '14', 'TTL индивидуальных страниц (дни)'),
('payment_max_attempts', '3', 'Максимум попыток списания'),
('payment_retry_days', '[1, 3, 5]', 'Дни повторных попыток'),
('grace_period_days', '3', 'Грейс-период после неудачного платежа (дни)'),
('email_from_name', 'Астролог', 'Имя отправителя писем'),
('telegram_bot_token', '', 'Токен Telegram-бота'),
('max_bot_token', '', 'Токен MAX-бота');

-- ============================================
-- МЕНЮ САЙТА
-- ============================================
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    location VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- АУДИТ / ЛОГИ
-- ============================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- ОТПРАВЛЕННЫЕ СООБЩЕНИЯ
-- ============================================
CREATE TABLE sent_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    horoscope_id BIGINT REFERENCES generated_horoscopes(id),
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    external_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sent_user ON sent_messages(user_id);
CREATE INDEX idx_sent_horoscope ON sent_messages(horoscope_id);
```

---

## 5. БИЗНЕС-ЛОГИКА

### 5.1. Регистрация и триал

**Входные данные:** email, пароль, имя, дата рождения, время рождения (опц.), город рождения, выбранные типы общих гороскопов + частота, каналы доставки.

**Процесс:**
1. Валидация данных
2. Создание пользователя
3. Расчёт знака зодиака по дате рождения
4. Если указано время и место → запрос к Python-сервису для натальной карты
5. Создание записей в `user_subscriptions` для выбранных общих гороскопов
6. Создание записи в `user_channels` (email + опциональные)
7. Активация триала: `trial_started_at = NOW()`, `trial_ends_at = NOW() + trial_days`, `individual_status = 'trial'`
8. Генерация первого индивидуального гороскопа (неполного)
9. Отправка приветственного письма с гороскопом
10. Логирование

### 5.2. Генерация гороскопов

**Общие:** батчами по расписанию. Для каждого знака (12) × каждый активный тип. Результат: `content_short` + `content_full`. Создаётся страница с TTL.

**Индивидуальные:** для каждого пользователя с активной подпиской/триалом. Промпт включает натальные данные. Обновляется раз в `individual_update_interval_days`.

**Формат ответа AI (ожидается JSON):**
```json
{
    "title": "Гороскоп для Овна на 27 августа 2026",
    "content_short": "Сегодня звёзды благоприятствуют...",
    "content_full": "Полный текст гороскопа...",
    "lucky_number": 7,
    "lucky_color": "синий"
}
```

**Обработка ошибок:** retry до 3 раз. При 3 неудачах — лог, алерт, `generation_status = 'failed'`.

### 5.3. Логика переключения общих/индивидуальных

**Активация индивидуальной подписки:**
1. Платёж успешен → создаётся `recurrent_subscription`
2. Находятся все активные общие подписки пользователя
3. Сохраняется snapshot в `subscription_snapshots`: `[{subscription_id, type_id, frequency, status}]`
4. Общие подписки приостанавливаются (`status = 'paused'`, `paused_at = NOW()`)
5. Активируется индивидуальная, `users.individual_status = 'active'`
6. В личном кабинете — баннер: «Общие приостановлены. Включить? [галочки]»

**Ручное включение общих:** статус выбранных подписок меняется с `paused` на `active`. Эти подписки НЕ затрагиваются при восстановлении из snapshot.

**Окончание подписки:**
1. Находится последний активный snapshot
2. Восстанавливаются подписки (вручную включённые — не трогаем, автоматически приостановленные — восстанавливаем)
3. `individual_status = 'expired'` или `'cancelled'`
4. Snapshot помечается как `restored`

### 5.4. Рекуррентные платежи

**Первый платёж:**
1. `POST /v2/Init` (Recurrent: "Y", SuccessURL, FailURL)
2. Редирект пользователя на страницу оплаты
3. Webhook от Т-Банка при успехе
4. Сохраняем `recurrent_token`, создаём `recurrent_subscription`

**Ежедневные списания (cron):**
1. Находим все `recurrent_subscriptions WHERE status = 'active' AND next_payment_date <= TODAY`
2. `POST /v2/ChargeRecurrent` (token, amount)
3. Успех → платёж `success`, продление подписки, обновление `next_payment_date`
4. Неудача → платёж `failed`, `attempt_number += 1`
5. При `attempt < max_attempts` → повтор через N дней (из настроек)
6. При `attempt >= max_attempts` → грейс-период → отмена → уведомление → восстановление общих

**Отмена пользователем:** доступ сохраняется до конца оплаченного периода, затем — восстановление общих.

### 5.5. Рассылка гороскопов

**Ежедневно (08:00 по таймзоне пользователя):** всем с активными ежедневными подписками.
**Еженедельно (понедельник 08:00):** всем с еженедельными подписками.
**Индивидуальный (раз в 2 недели):** если последний гороскоп старше `individual_update_interval_days`.

**Формат сообщения:**
- Тема: «🔮 Ваш {тип} гороскоп на {дата}»
- Тело: `content_short` + кнопка «Читать полностью» (ссылка на страницу)
- Снизу: ссылка отписки, ссылка на личный кабинет

Каналы: email (всегда), telegram/max (если подключены).

---

## 6. ПОЛЬЗОВАТЕЛЬСКАЯ ЧАСТЬ

### 6.1. Публичные страницы

| Страница | Маршрут | Описание |
|---|---|---|
| Главная / Лендинг | `/` | Описание, выбор гороскопов, регистрация |
| Страница гороскопа | `/horoscope/{slug}` | Полный текст + реклама + таймер |
| Просроченная страница | `/horoscope/{slug}` (TTL истёк) | Заглушка + CTA |
| Вход | `/login` | Email + пароль |
| Регистрация | `/register` | Форма с данными рождения |
| Восстановление пароля | `/forgot-password` | Сброс |
| Политика конфиденциальности | `/privacy` | Юр. страница |
| Оферта | `/terms` | Юр. страница |

### 6.2. Личный кабинет

| Страница | Маршрут | Описание |
|---|---|---|
| Дашборд | `/dashboard` | Статус подписки, ближайшие гороскопы |
| Мои гороскопы | `/dashboard/horoscopes` | Архив (полные тексты) |
| Подписки | `/dashboard/subscriptions` | Управление общими + индивидуальной |
| Каналы доставки | `/dashboard/channels` | email, telegram, max |
| Данные рождения | `/dashboard/birth-data` | Редактирование |
| Оплата | `/dashboard/billing` | История, управление рекуррентом |
| Настройки | `/dashboard/settings` | Имя, email, пароль, таймзона |
| Отписка | `/dashboard/unsubscribe` | Подтверждение |

### 6.3. Ключевые UI-компоненты

**Выбор гороскопов:** карточки с иконками, галочки, переключатель частоты, кнопка «Сохранить».

**Баннер статуса подписки:**
- Триал: «Пробный период: осталось X дней»
- Активна: «Индивидуальная подписка активна до {дата}»
- Истекла: «Подписка истекла. Продлить?»
- Общие приостановлены: предупреждение + галочки

**Генерируемая страница:** заголовок, дата, знак, полный текст, рекламные блоки, таймер, CTA «Получить персональный», кнопки «Поделиться».

**Просроченная страница:** «Гороскоп устарел», CTA «Войти / Зарегистрироваться».

---

## 7. АДМИН-ПАНЕЛЬ

### 7.1. Дашборд
- Пользователи (всего / новые за день / за месяц)
- Активные подписки (общие / индивидуальные)
- Конверсия триал → платная (%)
- MRR
- Отписки за период
- График регистраций (30 дней)
- Ошибки генерации за 24 часа

### 7.2. Клиенты
**Таблица:** ID, имя, email, знак, статус подписки, каналы, дата регистрации.
**Фильтры:** по типу подписки, статусу, каналу, платящие/бесплатные, знаку, дате.
**Действия:** просмотр профиля, ручное управление подпиской, тестовое сообщение.
**Экспорт:** CSV / XLSX.

### 7.3. Типы гороскопов
**Форма:** название, slug (авто), описание, категория, промпт для AI (с переменными `{zodiac_sign}`, `{period}`, `{natal_data}`), частота, активность, иконка.
**Кнопка «Тестовая генерация»** — проверка промпта.

### 7.4. Тарифы и подписки
- Частоты индивидуальной подписки (добавить/удалить)
- Цены для каждой частоты
- Длительность триала
- Интервал обновления индивидуального
- Грейс-период

### 7.5. Сгенерированные страницы
**Таблица:** заголовок, тип, знак, пользователь, дата создания, истекает, статус.
**Фильтры:** по типу, статусу, дате.
**Действия:** просмотр, продление TTL, удаление, редактирование.

### 7.6. Рассылки
- Шаблоны писем (тема + тело) для каждого типа гороскопа
- Шаблоны для Telegram и MAX
- Тестовая отправка
- История отправок
- Статистика (доставлено / открыто / ошибки)

### 7.7. Меню сайта
- Хедер и футер
- Поля: название, URL, порядок, активность
- Drag & drop для сортировки

### 7.8. Платежи
**Таблица:** пользователь, сумма, статус, дата, метод, попытка.
**Фильтры:** по статусу, дате, пользователю.
**Действия:** возврат, ручная пометка.

### 7.9. Настройки
- Общие: название сайта, email отправителя, таймзона
- Интеграции: ключи API (Timeweb, UniSender, Т-Банк, Telegram, MAX)
- SEO: мета-теги по умолчанию
- Рекламные категории

### 7.10. Логи
- Аудит действий
- Ошибки генерации AI
- Ошибки отправки

---

## 8. ИНТЕГРАЦИИ

### 8.1. Timeweb AI API

**Запрос:**
```http
POST https://api.timeweb.cloud/v1/ai/completions
Authorization: Bearer {TIMEWEB_API_KEY}
Content-Type: application/json

{
    "model": "llama-3-70b",
    "messages": [
        {"role": "system", "content": "..."},
        {"role": "user", "content": "{заполненный промпт}"}
    ],
    "temperature": 0.8,
    "max_tokens": 2000,
    "response_format": {"type": "json_object"}
}
```

**Требования:**
- Таймаут: 60 секунд
- Retry: 3 попытки (1с, 2с, 4с)
- Валидация: JSON с полями `title`, `content_short`, `content_full`
- Логирование: каждый запрос/ответ

**Настройки в админке:** модель, temperature, max tokens, системный промпт.

### 8.2. Т-Банк (рекуррентные платежи)

**Endpoints:**
1. `POST /v2/Init` — первый платёж (Recurrent: "Y", SuccessURL, FailURL)
2. `POST /v2/ChargeRecurrent` — рекуррентное списание (token, amount)
3. `POST /v2/CancelRecurrent` — отмена подписки

**Webhook:**
- URL: `https://{domain}/api/webhooks/tbank`
- События: `AUTHORIZED`, `CONFIRMED`, `REJECTED`, `REFUNDED`
- Валидация подписи (SHA-256)

### 8.3. UniSender (email)

**Методы:**
- `POST /api/v3/SendMessage` — одиночное письмо
- Пакетная отправка для массовых рассылок

**Шаблоны:** приветственное, гороскоп (ежедн/еженед), индивидуальный, триал заканчивается (за 2 дня, за 1 день, сегодня), платёж не прошёл, подписка истекла/продлена, отписка.

**Требования:** ссылка отписки в 1 клик, ссылка на личный кабинет, адаптивный HTML.

### 8.4. Telegram Bot

**Подключение:**
1. Личный кабинет → «Подключить Telegram» → ссылка на бота
2. Пользователь пишет `/start` боту
3. Бот выдаёт одноразовый код
4. Пользователь вводит код в личном кабинете
5. Система связывает `telegram_chat_id` с `user_id`
6. Подтверждение от бота

**Команды:** `/start`, `/stop`, `/help`. Кнопки: «Получить гороскоп», «Личный кабинет», «Отписаться».

### 8.5. MAX

Аналогично Telegram (подключение через код привязки, формат сообщений такой же).

### 8.6. Python-микросервис (натальные карты)

**Endpoint:** `POST /natal-chart`
**Body:** `birth_date`, `birth_time`, `birth_city`, `birth_country`, `latitude`, `longitude`
**Response:** `zodiac_sign`, `ascendant`, `moon_sign`, `chinese_zodiac`, `planets` (sun, moon, mercury, venus, mars со знаком/градусом/домом), `houses`, `aspects`.

**Библиотека:** `kerykeion` (обёртка над Swiss Ephemeris).
**Деплой:** отдельный Docker-контейнер, внутренний порт 8000, доступ только из внутренней сети.

---

## 9. ПЛАНИРОВЩИК (CRON)

| Задача | Расписание | Описание |
|---|---|---|
| `horoscopes:generate-general` | Ежедневно 00:00 | Генерация общих на день для всех знаков |
| `horoscopes:generate-individual` | Ежедневно 02:00 | Индивидуальные (для тех, кому пора обновить) |
| `horoscopes:send-daily` | Ежедневно 08:00 | Рассылка ежедневных |
| `horoscopes:send-weekly` | Понедельник 08:00 | Рассылка еженедельных |
| `subscriptions:check-expiry` | Ежедневно 00:30 | Истёкшие подписки, восстановление общих |
| `subscriptions:trial-reminders` | Ежедневно 09:00 | Напоминания о конце триала |
| `payments:process-recurrent` | Ежедневно 01:00 | Рекуррентные списания |
| `payments:retry-failed` | Ежедневно 01:30 | Повторные попытки |
| `pages:expire` | Ежедневно 03:00 | Пометка просроченных страниц |
| `messages:retry-failed` | Каждый час | Повторная отправка |
| `cleanup:old-data` | Воскресенье 04:00 | Очистка логов, просроченных страниц |

**Реализация:** `Laravel Scheduler`, одна cron-запись: `* * * * * php artisan schedule:run`.

---

## 10. ОЧЕРЕДИ

| Очередь | Назначение | Приоритет |
|---|---|---|
| `emails` | Отправка писем через UniSender | Высокий |
| `telegram` | Отправка в Telegram | Высокий |
| `max` | Отправка в MAX | Высокий |
| `ai-generation` | Генерация через Timeweb AI | Средний |
| `notifications` | Системные уведомления | Средний |
| `webhooks` | Обработка вебхуков Т-Банка | Высокий |

**Настройка:** минимум 2 воркера на продакшене. Retry: 3 попытки, задержка 30 секунд.

---

## 11. БЕЗОПАСНОСТЬ

1. **Аутентификация:** JWT для API, сессии для веб. Пароли — bcrypt.
2. **ПДн (152-ФЗ):** согласие при регистрации, хранение в РФ, удаление аккаунта.
3. **Платежи:** карты не хранятся, только рекуррентные токены.
4. **Вебхуки:** валидация подписи (Т-Банк, Telegram).
5. **Rate limiting:** API 60/мин, регистрация 5/час, AI 100/час.
6. **Валидация:** сервер + клиент.
7. **CSRF:** на всех формах.
8. **SQLi / XSS:** ORM, экранирование.
9. **Логирование:** платежи, подписки, ПДн.
10. **Бэкапы:** ежедневно, хранение 30 дней.

---

## 12. ФАЗЫ РАЗРАБОТКИ И КРИТЕРИИ ПРИЁМКИ

### 🔵 ФАЗА 1: MVP (6–8 недель)

**Неделя 1–2: Инфраструктура**
- [ ] Настройка сервера (Nginx, PHP 8.3, PostgreSQL, Redis)
- [ ] Инициализация Laravel + Filament
- [ ] Инициализация Next.js (App Router)
- [ ] Все миграции БД
- [ ] Сиды: типы гороскопов, настройки
- [ ] Python-микросервис (Docker, `/natal-chart`)
- [ ] CI/CD

**Неделя 3–4: Регистрация и авторизация**
- [ ] Регистрация (email, пароль, данные рождения, выбор гороскопов)
- [ ] Расчёт знака зодиака + натальная карта
- [ ] Авторизация (вход, выход, восстановление)
- [ ] Личный кабинет: базовый дашборд
- [ ] Управление общими подписками
- [ ] Управление каналами (email)

**Неделя 5–6: Генерация и рассылка**
- [ ] Интеграция с Timeweb AI
- [ ] Генерация общих (батч по знакам)
- [ ] Генерируемые страницы (SSR, TTL, заглушка)
- [ ] Интеграция с UniSender (шаблоны)
- [ ] Ежедневная/еженедельная рассылка
- [ ] Триал 7 дней

**Неделя 7–8: Админка и полировка**
- [ ] Админка: клиенты, типы гороскопов, настройки
- [ ] Меню сайта
- [ ] Сгенерированные страницы
- [ ] Тестирование, багфикс, деплой

**Критерии приёмки Фазы 1:**
- Регистрация работает, натальная карта считается
- Общие гороскопы приходят на email
- Триал индивидуального работает
- Генерируемые страницы открываются, TTL работает
- Админка управляет типами, клиентами, меню

### 🟢 ФАЗА 2: Подписки и оплата (4–6 недель)

**Неделя 9–10: Натальная карта и индивидуальный**
- [ ] Полная интеграция с Python-сервисом
- [ ] Промпт с натальными данными
- [ ] Обновление раз в 2 недели
- [ ] Архив гороскопов в ЛК

**Неделя 11–12: Платежи**
- [ ] Интеграция с Т-Банк (первый + рекуррент)
- [ ] Webhooks
- [ ] Рекуррентные списания (cron)
- [ ] Обработка неудачных (retry, грейс)
- [ ] История платежей

**Неделя 13–14: Логика подписок**
- [ ] Snapshot/restore общих
- [ ] Пауза общих при активации индивидуальной
- [ ] Ручное включение общих
- [ ] Восстановление при окончании
- [ ] Отмена пользователем
- [ ] Уведомления в ЛК

**Критерии приёмки Фазы 2:**
- Оплата картой работает
- Рекуррент автоматический
- Логика паузы/восстановления корректна
- Неудачный платёж: 3 попытки → грейс → отмена → восстановление
- Отмена подписки, доступ до конца периода

### 🟡 ФАЗА 3: Мессенджеры и масштабирование (4–6 недель)

**Неделя 15–16: Мессенджеры**
- [ ] Telegram-бот: подключение, рассылка
- [ ] MAX-бот: аналогично
- [ ] Управление каналами в ЛК

**Неделя 17–18: Расширенный контент**
- [ ] Китайский и тибетский гороскопы
- [ ] Добавление новых типов из админки
- [ ] Рекламные блоки на страницах

**Неделя 19–20: PWA и аналитика**
- [ ] PWA: манифест, SW, иконки, офлайн
- [ ] Аналитика: конверсии, MRR, retention
- [ ] SEO: мета-теги, OG, sitemap
- [ ] Нагрузочное тестирование

**Критерии приёмки Фазы 3:**
- Telegram работает
- Новые типы из админки без деплоя
- PWA устанавливается на телефон
- Реклама на страницах

---

## 13. ТРЕБОВАНИЯ К КОДУ

1. **Стиль:** PSR-12 (PHP), ESLint + Prettier (JS/TS)
2. **Тесты:** минимум 70% покрытия бизнес-логики
3. **Коммиты:** Conventional Commits
4. **Документация:** README с инструкцией деплоя, `.env.example`
5. **Миграции:** только через `php artisan make:migration`
6. **Конфигурация:** секреты только в `.env`
7. **Логирование:** все критические операции
8. **Обработка ошибок:** try-catch на всех внешних вызовах

---

## 14. ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ (.env)

```env
# App
APP_NAME="Астролог"
APP_URL=https://astro.example.com
API_URL=https://api.astro.example.com

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_DATABASE=astro
DB_USERNAME=astro_user
DB_PASSWORD=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Timeweb AI
TIMEWEB_API_KEY=
TIMEWEB_AI_MODEL=llama-3-70b
TIMEWEB_AI_TIMEOUT=60

# T-Bank
TBANK_TERMINAL_KEY=
TBANK_SECRET_KEY=
TBANK_WEBHOOK_URL=https://astro.example.com/api/webhooks/tbank

# UniSender
UNISENDER_API_KEY=
UNISENDER_SENDER_EMAIL=noreply@astro.example.com
UNISENDER_SENDER_NAME="Астролог"

# Telegram
TELEGRAM_BOT_TOKEN=

# MAX
MAX_BOT_TOKEN=

# Python Astro Service
ASTRO_SERVICE_URL=http://127.0.0.1:8000

# JWT
JWT_SECRET=
JWT_TTL=10080
```

---

## 15. ВОПРОСЫ ДЛЯ УТОЧНЕНИЯ У ЗАКАЗЧИКА

Перед началом работы задай следующие вопросы:

| # | Вопрос |
|---|---|
| 1 | Есть ли макеты дизайна, или использовать Tailwind defaults? |
| 2 | Нужна ли мультиязычность (хотя бы задел)? |
| 3 | Какой домен будет использоваться? |
| 4 | Есть ли зарегистрированные аккаунты Timeweb, Т-Банк, UniSender, Telegram? |
| 5 | Какой бюджет на серверы и API (примерно в месяц)? |
| 6 | Нужен ли мобильный вебвю в будущем (влияет на архитектуру API)? |
| 7 | Какие рекламные сети планируется подключить (AdSense, РСЯ, MyTarget)? |
| 8 | Есть ли юрист для подготовки оферты и политики конфиденциальности? |

---

## 16. ПЛАН ДЕЙСТВИЙ CODER

### Шаг 0: Подготовка
1. Создать пустой Git-репозиторий с моно- или мульти-репо структурой.
2. Инициализировать backend (Laravel 11), frontend (Next.js 14), astro-service (Python FastAPI).
3. Настроить CI/CD (GitHub Actions / GitLab CI).
4. Подготовить `.env.example` и `docker-compose.yml` для локальной разработки.

### Шаг 1: Уточнение
1. Задать вопросы из раздела 15 заказчику.
2. Предложить структуру монорепозитория и получить согласие.
3. Согласовать порядок работы (фича-ветки, PR, ревью).

### Шаг 2: Фундамент (Фаза 1, недели 1–2)
1. Настроить сервер (Nginx + PHP-FPM + PostgreSQL + Redis).
2. Реализовать миграции БД.
3. Запустить сиды.
4. Поднять Python-микросервис (Docker).
5. Настроить Filament-админку (базовый доступ).

### Шаг 3: Регистрация и ЛК (Фаза 1, недели 3–4)
1. Реализовать API регистрации/авторизации (JWT).
2. Создать страницы регистрации/входа в Next.js.
3. Реализовать выбор гороскопов и данных рождения.
4. Интегрировать Python-сервис для натальной карты.
5. Базовый личный кабинет.

### Шаг 4: Генерация и рассылка (Фаза 1, недели 5–6)
1. Сервис-класс для Timeweb AI с retry.
2. Генерация общих гороскопов (cron).
3. Генерируемые страницы (Next.js SSR + TTL).
4. Интеграция UniSender.
5. Ежедневная/еженедельная рассылка.
6. Триал.

### Шаг 5: Админка MVP (Фаза 1, недели 7–8)
1. Разделы: клиенты, типы гороскопов, настройки, меню, страницы.
2. Тестирование.
3. Деплой на продакшен.

### Шаг 6+: Последующие фазы
Переход к Фазе 2 (подписки и платежи) и далее — только после приёмки предыдущей фазы заказчиком.

---

## 17. ПРИЛОЖЕНИЯ

### 17.1. Глоссарий
- **Натальная карта** — астрологическая карта, рассчитанная на момент рождения.
- **Асцендент** — знак зодиака, восходящий на восточном горизонте в момент рождения.
- **Транзиты** — текущее положение планет относительно натальной карты.
- **TTL** — Time To Live, время жизни страницы.
- **Рекуррентный платёж** — автоматическое списание по сохранённому токену.
- **Snapshot** — снимок состояния подписок в определённый момент.
- **Grace period** — грейс-период, льготный период после неудачного платежа.

### 17.2. Контакты интеграций
- **Timeweb AI:** https://timeweb.cloud/docs/ai
- **Т-Банк эквайринг:** https://www.tinkoff.ru/kassa/dev/payments/
- **UniSender API:** https://www.unisender.com/ru/support/api/
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **kerykeion (Python):** https://pypi.org/project/kerykeion/

---

**Конец ТЗ.**

Qwen Coder, после прочтения начни с раздела 15 (уточняющие вопросы) и раздела 16 (план действий). После согласования — приступай к Шагу 0.
```

---

### 💡 Как использовать этот файл

1. **Сохраните** содержимое выше в файл с именем `tz_astro_service.md` (или `.txt`).
2. **Зайдите на coder.qwen.ai** (или используйте интерфейс Qwen Coder, который у вас есть).
3. **Прикрепите файл** в первом сообщении или **скопируйте весь текст** в чат.
4. **Напишите вводную фразу**, например:
   > «Привет! Я прикрепил ТЗ на AI-сервис гороскопов. Ознакомься, задай уточняющие вопросы и предложи план старта работы. Работаем итеративно по фазам.»

Qwen Coder прочитает весь контекст, начнёт с уточняющих вопросов (раздел 15), и вы вместе пойдёте по фазам разработки. Если по ходу появятся новые идеи или изменения — просто давайте знать, я помогу актуализировать ТЗ.

Удачи с проектом! 🚀
