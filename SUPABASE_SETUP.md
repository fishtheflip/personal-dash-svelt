# Настройка Supabase

## 1. Создать проект

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) и создайте новый project.
2. В `SQL Editor` выполните файл `supabase/migrations/202606060001_initial_schema.sql`.
3. Затем выполните `supabase/migrations/202606090001_daily_check_ins.sql`.
4. После него выполните `supabase/migrations/202606110001_routines.sql`.
5. Затем выполните `supabase/migrations/202606140001_ideas.sql`.
6. После миграции идей выполните `supabase/migrations/202606140002_idea_goal_links.sql`.
7. Затем выполните `supabase/migrations/202606150001_calendar_note_order.sql`.
8. Затем выполните `supabase/migrations/202606180001_contacts.sql`.
9. После неё выполните `supabase/migrations/202606180002_contact_comments.sql`.
10. Затем выполните `supabase/migrations/202606250001_move_calendar_note_rpc.sql`.
11. В `Authentication → Providers → Email` оставьте Email provider включённым.
12. В `Authentication → Sign In / Providers` отключите публичную регистрацию пользователей (`Allow new users to sign up`), если она доступна в текущем интерфейсе.

## 2. Создать единственного пользователя

1. Откройте `Authentication → Users`.
2. Нажмите `Add user → Create new user`.
3. Укажите свой email и надёжный пароль, включите автоматическое подтверждение email.

## 3. Подключить приложение

1. В `Project Settings → API` скопируйте `Project URL` и публичный `anon` / `publishable` key.
2. Создайте локальный `.env`:

```env
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Перезапустите `npm run dev`.
4. Войдите под созданным пользователем.

`service_role` key приложению не нужен. Никогда не добавляйте его в `.env` фронтенда или Git.

## Данные и безопасность

- Все таблицы защищены Row Level Security.
- Каждая запись автоматически получает `owner_id = auth.uid()`.
- Авторизованный пользователь видит и изменяет только собственные записи.
- При первом входе приложение импортирует текущие локальные данные, если соответствующая таблица пуста.
