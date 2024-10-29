# Используем базовый образ Python
FROM python:3.10.6

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Устанавливаем рабочую директорию
WORKDIR /code

# Копируем файл requirements.txt в контейнер
COPY requirements.txt /code/

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем entrypoint.sh в контейнер
COPY entrypoint.sh /entrypoint.sh

# Даем права на выполнение скрипта
RUN chmod +x /entrypoint.sh

# Копируем оставшиеся файлы проекта
COPY . /code/

# Команда по умолчанию для запуска сервера Django
CMD ["uwsgi", "--ini", "./uwsgi.ini"]