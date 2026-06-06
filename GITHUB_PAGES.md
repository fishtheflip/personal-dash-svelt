# Публикация на GitHub Pages

Проект настроен для автоматической публикации из ветки `main`.

Адрес сайта после первой успешной публикации:

```text
https://fishtheflip.github.io/personal-dash-svelt/
```

## 1. Добавить GitHub Actions secrets

Откройте репозиторий:

`Settings → Secrets and variables → Actions → New repository secret`

Добавьте два секрета:

```text
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
```

Значения возьмите из локального `.env`. Не добавляйте `service_role` key.

## 2. Включить GitHub Pages

Откройте:

`Settings → Pages → Build and deployment → Source`

Выберите `GitHub Actions`.

## 3. Разрешить адрес сайта в Supabase

Откройте Supabase:

`Authentication → URL Configuration`

Укажите:

```text
Site URL:
https://fishtheflip.github.io/personal-dash-svelt/

Redirect URLs:
http://127.0.0.1:5174/**
https://fishtheflip.github.io/personal-dash-svelt/**
```

Для текущего входа по email и паролю redirect URL не обязателен, но он понадобится
для восстановления пароля, magic link и OAuth.

## 4. Опубликовать

После push в `main` workflow `.github/workflows/deploy-pages.yml` автоматически:

1. устанавливает зависимости;
2. запускает `npm run check`;
3. собирает статический сайт;
4. публикует папку `build` в GitHub Pages.

Статус публикации отображается во вкладке `Actions` репозитория.
