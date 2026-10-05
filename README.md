# Nopeyes ⚡ — Telegram Mini App

> Один острый моральный вопрос в день для всех. Как Wordle, но про выбор и этические дилеммы.

Бот в Telegram: **[@nopeyes_play_bot](https://t.me/nopeyes_play_bot)**

---

## 🌟 Возможности и механика

1. **Ежедневная дилемма**: Каждый день публикуется один глубокий, спорный этический вопрос с двумя взаимоисключающими вариантами ответа.
2. **Один голос в день**: Пользователь может проголосовать только один раз за сутки.
3. **Мгновенная статистика**: Сразу после голосования открывается соотношение голосов с плавной анимацией и выводом («Ты в большинстве / меньшинстве»).
4. **Стрик активности**: Счётчик дней непрерывного участия пользователя (🔥), мотивирующий возвращаться каждый день.
5. **Карточка для шеринга**: Генерация стильной карточки с вопросом, выбором пользователя и его процентом («⚡ Я с 12%») и нативной кнопкой отправки в Telegram чаты.
6. **Безопасная авторизация**: Валидация подписи Telegram WebApp `initData` на бэкенде через HMAC-SHA256.

---

## 🛠 Стек технологий

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Canvas Confetti, Lucide Icons.
- **Backend**: Vercel Serverless Functions (`/api/today`, `/api/vote`, `/api/seed`).
- **База данных**: PostgreSQL (Neon Serverless / Supabase / Vercel Postgres).
- **Интеграция**: Telegram WebApp SDK, Haptic Feedback, поддержка Telegram Theme.

---

## 🚀 Локальный запуск

1. Склонируйте репозиторий и установите зависимости:
   ```bash
   npm install
   ```

2. Создайте файл `.env` на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Укажите значения:
   - `BOT_TOKEN` — токен вашего бота от `@BotFather`
   - `DATABASE_URL` — строка подключения к Postgres (Neon или Supabase)

3. Запустите проект в режиме разработки:
   ```bash
   npm run dev
   ```

4. Сборка для продакшена:
   ```bash
   npm run build
   ```

---

## 🗄 Структура базы данных

- **users**: `id`, `telegram_id`, `username`, `first_name`, `streak`, `last_vote_date`, `created_at`
- **questions**: `id`, `text`, `option_a`, `option_b`, `date`, `created_at`
- **votes**: `id`, `user_id`, `question_id`, `choice`, `created_at`

Seed-набор содержит 30 сложных, нетривиальных моральных дилемм.

---

## ☁️ Деплой на Vercel

1. Импортируйте репозиторий в [Vercel](https://vercel.com).
2. В настройках проекта (**Settings -> Environment Variables**) добавьте:
   - `BOT_TOKEN`: токен вашего бота
   - `DATABASE_URL`: строка подключения Postgres (Neon/Supabase)
3. Нажмите **Deploy**.

---

## 🤖 Настройка в @BotFather

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Введите `/newapp` (или `/setmenubutton`).
3. Выберите бота `@nopeyes_play_bot`.
4. Укажите название: `Nopeyes` и короткое описание.
5. Вставьте полученную HTTPS-ссылку от Vercel.
