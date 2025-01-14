import os
import re
import zipfile
import tempfile
import shutil
from datetime import datetime
import string

from PIL import Image
from PIL.ExifTags import TAGS

from celery import shared_task

def extract_fio(text):
    fio_pattern = r'(?:^|[ \-_])([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)?[ \-_][а-яА-ЯёЁ]+[ \-_][а-яА-ЯёЁ]+(?:ович|евич|овна|евна|ична|инична))'

    fios = re.findall(fio_pattern, text)

    return fios

def extract_dob(text):
    import dateparser
    date_pattern = r'\b(?:\d{1,2}\s[а-яА-Я]+\s\d{4}|\d{1,2}[./]\d{1,2}[./]\d{4})\b'
    # Поиск всех дат в тексте
    date_strings = re.findall(date_pattern, text)

    # Распознавание дат
    birth_dates = [dateparser.parse(date, languages=['ru']) for date in date_strings]
    birth_dates_str = [i.strftime('%d.%m.%Y') for i in birth_dates]
    return birth_dates_str

def extract_phone(text):
    phone_pattern = r'\+?\d{1,3}?[-.\s]??\(?\d{1,4}?\)?[-.\s]??\d{1,4}[-.\s]??\d{1,9}'
    phones = re.findall(phone_pattern, text)
    return phones

def extract_email(text):
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    emails = re.findall(email_pattern, text)
    return emails

def get_exif_date(image_path):
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()
        if not exif_data:
            return None
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == 'DateTimeOriginal':
                return datetime.strptime(value, '%Y:%m:%d %H:%M:%S')
    except Exception:
        return None
    return None

def is_readable(filename):
    readable_characters = string.ascii_letters + string.digits + string.punctuation + ' ' + 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'
    return all(char in readable_characters for char in filename)

def decode_filename(filename):
    # Проверяем, является ли имя читаемым
    if is_readable(filename):
        print(f"Имя файла уже корректное: {filename}")
        return filename

    # Если имя не читаемое, пробуем другие кодировки
    encodings = ['cp866', 'windows-1251', 'latin1']
    for encoding in encodings:
        try:
            decoded = filename.encode('cp437').decode(encoding)
            if is_readable(decoded):
                print(f"Имя файла успешно декодировано как {encoding}: {decoded}")
                return decoded
        except UnicodeDecodeError as e:
            print(f"Ошибка декодирования с {encoding}: {e}")
            continue

    # Если ни одна из кодировок не подошла, возвращаем с заменой символов
    print(f"Не удалось корректно декодировать имя файла")
    return filename


@shared_task
def process_zip_task(file_path):
    try:
        # Создаём временные пути
        temp_dir = tempfile.gettempdir()
        extracted_path = os.path.join(temp_dir, f"extracted_{os.path.basename(file_path)}")

        # Извлечение архива
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            for file_info in zip_ref.infolist():
                try:
                    # Декодируем имя файла
                    file_info.filename = decode_filename(file_info.filename)
                except Exception as e:
                    print(f"Ошибка декодирования имени файла: {e}")
                    continue
                zip_ref.extract(file_info, extracted_path)

        # Обработка содержимого
        all_fios = []
        for root, dirs, files in os.walk(extracted_path):
            for file_name in files:
                fios = extract_fio(file_name)
                all_fios.extend(fios)

        # Удаляем дубликаты
        all_fios = list(set(all_fios))

        # Удаляем временные файлы
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            if os.path.exists(extracted_path):
                shutil.rmtree(extracted_path, ignore_errors=True)
        except Exception as cleanup_error:
            print(f"Ошибка при удалении временных файлов: {cleanup_error}")

        return {'success': True, 'fios': all_fios} if all_fios else {'success': False, 'error': 'ФИО не найдено'}

    except Exception as e:
        return {'success': False, 'error': str(e)}