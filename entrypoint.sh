#!/bin/bash

python /code/docere/manage.py migrate

python /code/docere/manage.py collectstatic --noinput

chown -R www-data:www-data /code/docere/media

# Создаём суперпользователя, если его ещё нет
python /code/docere/manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@example.com", "admin")
    print("Суперпользователь создан: admin / admin")
else:
    print("Суперпользователь уже существует")
EOF

exec "$@"