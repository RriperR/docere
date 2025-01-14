import os
import tempfile
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Patients, MedHistory

from main.tasks import process_zip_task

def process_zip(request):
    if request.method == 'POST':
        try:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file.name.endswith('.zip'):
                return JsonResponse({'success': False, 'error': 'Файл должен быть ZIP-архивом'})

            # Создаём временный путь для сохранения файла
            temp_dir = tempfile.gettempdir()
            zip_path = os.path.join(temp_dir, uploaded_file.name)

            # Сохраняем загруженный файл
            with open(zip_path, 'wb') as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)

            # Передаём задачу в Celery
            task = process_zip_task.delay(zip_path)
            return JsonResponse({'success': True, 'task_id': task.id})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Метод запроса должен быть POST'})


@csrf_exempt
def confirm_fio(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        selected_fio = data.get('selectedFio')

        if selected_fio:
            patient, created = Patients.objects.get_or_create(title=selected_fio)
            return JsonResponse({'success': True, 'patient': patient.title})

        return JsonResponse({'success': False, 'error': 'ФИО не выбрано'})
