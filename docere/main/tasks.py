import os
import zipfile
import tempfile

from collections import Counter
from celery import shared_task
from django.core.files import File

from .models import Patient, MedicalRecord, LabFile
from .utils import extract_fio, decode_filename


@shared_task
def process_zip_task(file_path):
    """
    1) Определяем пациента по самой часто встречающейся фамилии (или ФИО),
    2) Создаём одну запись MedicalRecord,
    3) Для каждого извлечённого файла создаём объект LabFile, связанный с этой записью.
    """
    try:
        if not os.path.exists(file_path):
            return {'success': False, 'error': 'Файл не найден'}

        # Собираем все ФИО из имени архива
        all_names = []
        archive_basename = os.path.basename(file_path)
        archive_fios = extract_fio(archive_basename)
        if archive_fios:
            all_names.extend(archive_fios)

        # Извлекаем файлы во временную директорию
        with tempfile.TemporaryDirectory() as extracted_path:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                for file_info in zip_ref.infolist():
                    try:
                        file_info.filename = decode_filename(file_info.filename)
                    except Exception as e:
                        print(f"Ошибка декодирования имени файла: {e}")
                        continue

                    # Собираем ФИО из имени файла
                    file_fios = extract_fio(file_info.filename)
                    if file_fios:
                        all_names.extend(file_fios)

                    # Извлекаем файл
                    zip_ref.extract(file_info, extracted_path)

            # Если ни одно ФИО не найдено, возвращаем ошибку
            if not all_names:
                return {'success': False, 'error': 'ФИО не найдено в имени архива или файлов'}

            # Определяем фамилию/ФИО, встречающуюся чаще всего
            most_common_name, _ = Counter(all_names).most_common(1)[0]

            # Пытаемся найти пациента
            try:
                patient = Patient.objects.get(title__icontains=most_common_name)
            except Patient.DoesNotExist:
                # Создаём нового, если не нашли
                patient = Patient.objects.create(title=most_common_name)

            # Создаём ОДНУ запись MedHistory для всего архива
            record = MedicalRecord.objects.create(
                patient=patient,
                doctor=None,  # Можно заполнить при необходимости
                appointment_location="",
                notes="",
                visit_date=None,
            )

            # Для каждого извлечённого файла создаём запись в LabFile
            for root, dirs, files in os.walk(extracted_path):
                for file_name in files:
                    file_full_path = os.path.join(root, file_name)

                    # Создаём объект LabFile
                    lab_file = LabFile.objects.create(
                        record=record
                    )

                    # Сохраняем сам файл
                    with open(file_full_path, 'rb') as f:
                        lab_file.file.save(file_name, File(f), save=True)

        if os.path.exists(file_path):
            os.remove(file_path)

        return {'success': True, 'message': 'Файл обработан и удалён'}

    except Exception as e:
        return {'success': False, 'error': str(e)}
