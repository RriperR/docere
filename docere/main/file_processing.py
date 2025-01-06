import os
import zipfile
import re
import tempfile
import shutil
from datetime import datetime

from django.http import JsonResponse
from PIL import Image
from PIL.ExifTags import TAGS

from .models import Patients, MedHistory

def extract_fio_and_dob(text):
    fio_pattern = r'(?:^|[ \-_])([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)?[ \-_][а-яА-ЯёЁ]+[ \-_][а-яА-ЯёЁ]+(?:ович|евич|овна|евна|ична|инична))'
    dob_pattern = r'(\d{2}-\d{2}-\d{4}|\d{2}\.\d{2}\.\d{4})'

    fios = re.findall(fio_pattern, text)
    dobs = re.findall(dob_pattern, text)

    return fios, dobs


def extract_contacts(text):
    phone_pattern = r'\+?\d{1,3}?[-.\s]??\(?\d{1,4}?\)?[-.\s]??\d{1,4}[-.\s]??\d{1,9}'
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    phones = re.findall(phone_pattern, text)
    emails = re.findall(email_pattern, text)
    return phones, emails

def get_exif_date(image_path):
    """
    Извлекает дату из метаданных EXIF изображения.
    """
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

def process_zip(request):
    if request.method == 'POST':
        try:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file.name.endswith('.zip'):
                return JsonResponse({'success': False, 'error': 'Файл должен быть ZIP-архивом'})

            # Создаём путь для временного файла
            temp_dir = tempfile.gettempdir()
            zip_path = os.path.join(temp_dir, uploaded_file.name)

            # Сохраняем загруженный файл
            with open(zip_path, 'wb') as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)

            # Путь для извлечённых данных
            extracted_path = os.path.join(temp_dir, f"extracted_{uploaded_file.name}")

            # Работаем с архивом
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extracted_path)

            # Анализ содержимого
            all_fios = []
            for root, dirs, files in os.walk(extracted_path):
                for dir_name in dirs:
                    fios, _ = extract_fio_and_dob(dir_name)
                    print(f"Извлечено из папки '{dir_name}': {fios}")
                    all_fios.extend(fios)

                for file_name in files:
                    fios, _ = extract_fio_and_dob(file_name)
                    print(f"Извлечено из файла '{file_name}': {fios}")
                    all_fios.extend(fios)

            all_fios = list(set(all_fios))  # Удаляем дубликаты

            if len(all_fios) > 0:
                return JsonResponse({'success': True, 'fios': all_fios})

            return JsonResponse({'success': False, 'error': 'ФИО не найдено'})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

        finally:
            # Удаляем временные файлы
            try:
                if os.path.exists(zip_path):
                    os.remove(zip_path)
                if os.path.exists(extracted_path):
                    shutil.rmtree(extracted_path, ignore_errors=True)
            except Exception as cleanup_error:
                print(f"Ошибка при удалении временных файлов: {cleanup_error}")

    return JsonResponse({'success': False, 'error': 'Метод запроса должен быть POST'})



from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def confirm_fio(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        selected_fio = data.get('selectedFio')

        if selected_fio:
            patient, created = Patients.objects.get_or_create(title=selected_fio)
            return JsonResponse({'success': True, 'patient': patient.title})

        return JsonResponse({'success': False, 'error': 'ФИО не выбрано'})
