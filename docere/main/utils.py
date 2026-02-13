import re
from datetime import datetime

import dateparser
import string

from PIL import Image
from PIL.ExifTags import TAGS


def extract_fio(text: str) -> list[str]:
    """
    Находит ФИО вида "Фамилия Имя Отчество" с возможным дефисом в фамилии
    и типичными русскими суффиксами отчества.
    """
    pattern = (
        r'(?:^|[ \-_])'
        r'([А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?'
        r'[ \-_][А-ЯЁ][а-яё]+'
        r'[ \-_][А-ЯЁ][а-яё]+(?:ович|евич|овна|евна|ична|инична))'
    )
    return re.findall(pattern, text)


def extract_dob(text: str) -> list[str]:
    """
    Находит даты в формате "DD Month YYYY" или "D.M.YYYY" и
    возвращает их в формате "DD.MM.YYYY".
    """
    # Ищем все вхождения по шаблону
    date_pattern = r'\b(?:\d{1,2}\s[А-Яа-яЁё]+\s\d{4}|\d{1,2}[./]\d{1,2}[./]\d{4})\b'
    found = re.findall(date_pattern, text)
    parsed = []
    for s in found:
        dt = dateparser.parse(s, languages=['ru'])
        if dt:
            parsed.append(dt.strftime('%d.%m.%Y'))
    return parsed


def extract_phone(text: str) -> list[str]:
    """
    Ищет телефонные номера в различных форматах.
    """
    pattern = r'\+?\d{1,3}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'
    return re.findall(pattern, text)


def extract_email(text: str) -> list[str]:
    """
    Находит email-адреса.
    """
    pattern = r'[A-Za-z0-9_.+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-.]+'
    return re.findall(pattern, text)


def get_exif_date(image_path: str) -> datetime | None:
    """
    Возвращает DateTimeOriginal из EXIF, если есть.
    """
    try:
        with Image.open(image_path) as img:
            exif = img._getexif() or {}
        for tag_id, val in exif.items():
            if TAGS.get(tag_id) == 'DateTimeOriginal':
                return datetime.strptime(val, '%Y:%m:%d %H:%M:%S')
    except Exception:
        pass
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
