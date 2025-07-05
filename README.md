# Docere Medical Records Management

**Docere** — это приложение для управления медицинскими записями пациентов с возможностью шаринга между пользователями (врачами и пациентами).

## Быстрый старт

1. Склонируйте репозиторий и перейдите в корень проекта:
   ```bash
   git clone <repo-url>
   cd djangoProject
   ```

2. Скопируйте пример переменных окружения:
   ```bash
   cp .env.example .env
   ```

3. Запустите сервисы (entrypoint.sh автоматически применит миграции и соберет статику):
   ```bash
   docker-compose up -d
   ```

4. Запустите фронтенд для разработки:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Переменные окружения

- `SECRET_KEY` — секретный ключ Django.
- `DEBUG` — флаг отладки (`True` / `False`).
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — настройки подключения к БД Postgres.

---

## Основные API эндпоинты

Все запросы требуют JWT токен в заголовке `Authorization: Bearer <token>` (кроме регистрации и получения токена).

| Метод | Путь                                        | Описание                                |
|-------|---------------------------------------------|-----------------------------------------|
| POST  | `/api/user/register/`                       | Регистрация нового пользователя         |
| POST  | `/api/token/`                               | Получение JWT (email + пароль)          |
| POST  | `/api/token/refresh/`                       | Обновление JWT                          |
| GET   | `/api/user/me/`                             | Информация о текущем пользователе       |
| GET, POST | `/api/patients/`                        | Список и создание пациентов (admin/doctor) |
| GET   | `/api/patients/{id}/`                       | Детали пациента                         |
| GET, POST | `/api/patients/{patient_id}/records/`  | Список и создание записей пациента      |
| GET, PATCH, DELETE | `/api/patients/{patient_id}/records/{id}/` | Работа с конкретной записью |
| GET, POST | `/api/share-requests/`                  | Список шарингов и создание ShareRequest |
| POST  | `/api/share-requests/{id}/respond/`         | Принятие/отклонение ShareRequest        |
| POST  | `/api/record-shares/{id}/respond/`          | Принятие/отклонение конкретного RecordShare |

---

## Роли и права

- **patient** (пациент):
  - видит свои данные и записи.
  - может шарить свои записи другим.
- **doctor** (врач):
  - видит записи пациентов, с которыми связался.
  - может создавать и шарить новые записи.
- **admin** (администратор):
  - полный доступ ко всем ресурсам.

---

## Работа с шарингом

1. Создание `ShareRequest` и связанных `RecordShare` через `/api/share-requests/`.
2. Получатель вызывает `/api/share-requests/{id}/respond/` для подтверждения всего пакета.
3. Или `/api/record-shares/{id}/respond/` для ответов по отдельным записям.

---

## Фронтенд

- Папка `frontend/src` содержит React-приложение с `zustand` для управления состоянием.
- Основная точка входа — `App.tsx`, маршруты прописаны через `react-router-dom`.
- UI компоненты лежат в `components/common` и страницах `pages/*`.

---

