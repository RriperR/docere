#!/bin/bash

python /code/docere/manage.py migrate

python /code/docere/manage.py collectstatic --noinput

chown -R www-data:www-data /code/docere/media

exec "$@"