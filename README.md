# AI-Астролог (ai-astrolog1)

AI-сервис персональных и общих гороскопов с триалом 7 дней, рекуррентной подпиской и мультиканальными рассылками.

## 📁 Структура проекта

```
ai-astrolog1/
├── backend/           # Laravel 11 + Filament 3 (API + админка)
├── frontend/          # Next.js 14 App Router (PWA, тёмная тема)
├── astro-service/     # Python FastAPI + kerykeion (расчёт натальных карт)
├── docs/              # Документация
├── docker/            # Docker Compose, конфиги сервисов
├── .github/workflows/ # CI/CD пайплайны
├── .env.example       # Шаблон переменных окружения
├── TZ.md              # Полное техническое задание
└── README.md
```

## 🚀 Быстрый старт

### Предварительные требования
- Docker & Docker Compose
- Git

### Установка

1. Клонировать репозиторий:
```bash
git clone <repository-url>
cd ai-astrolog1
```

2. Настроить переменные окружения:
```bash
cp .env.example .env
```

3. Запустить все сервисы:
```bash
docker compose up -d
```

4. Инициализировать Laravel:
```bash
docker compose exec backend composer install
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
```

5. Установить зависимости frontend:
```bash
docker compose exec frontend npm install
```

## 🔗 Сервисы

| Сервис | URL | Описание |
|--------|-----|----------|
| Frontend | http://localhost:3000 | Next.js PWA |
| Backend API | http://localhost:8000 | Laravel REST API |
| Admin Panel | http://localhost:8000/admin | Filament 3 |
| Astro Service | http://localhost:8001 | FastAPI + kerykeion |
| Swagger Docs | http://localhost:8001/docs | API документация |
| PostgreSQL | localhost:5432 | База данных |
| Redis | localhost:6379 | Кэш и очереди |

## 🛠 Разработка

**Backend:**
```bash
docker compose exec backend bash
php artisan migrate
php artisan db:seed
php artisan queue:work
```

**Frontend:**
```bash
docker compose exec frontend bash
npm run dev
```

**Astro Service:**
```bash
docker compose exec astro-service bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📦 Деплой

1. Обновить `.env` для production
2. `docker compose -f docker-compose.prod.yml build`
3. Настроить SSL (Let's Encrypt)
4. Настроить домен

## 📄 Документация

- [Техническое задание](TZ.md)
- [.env.example](.env.example)
- [Swagger Astro Service](http://localhost:8001/docs)

## 📝 Лицензия

Planetary calculations by [Swiss Ephemeris](https://www.astro.com/swisseph/).

---

**Статус:** Фаза 1 (MVP) — в разработке
