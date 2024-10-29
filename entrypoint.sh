#!/bin/bash

# Применяем миграции к базе данных
python /code/docere/manage.py migrate

# Собираем статические файлы
python /code/docere/manage.py collectstatic --noinput

# Устанавливаем права на директорию media
chown -R www-data:www-data /code/docere/media

# Запускаем uwsgi
exec "$@"
