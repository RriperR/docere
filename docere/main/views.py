import os
import zipfile
import re

from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import ListView, FormView, CreateView, TemplateView

from .forms import AddMedHistory, AddPatientForm, UploadFileForm
from .models import Patients, MedHistory, UploadFiles
from .utils import DataMixin


class MainPage(DataMixin, TemplateView):
    title_page = 'Главная страница'
    template_name = 'main/index.html'

class AboutPage(DataMixin, TemplateView):
    title_page = 'О сайте'
    template_name = 'main/about.html'


class UploadInfo(DataMixin, CreateView):
    form_class = UploadFileForm
    template_name = 'main/upload.html'
    success_url = reverse_lazy('home')
    title_page = 'Загрузить данные'


class AddPatient(DataMixin, CreateView):
    form_class = AddPatientForm
    template_name = 'main/add_patient.html'
    success_url = reverse_lazy('home')
    title_page = 'Добавить пациента'

class AddInfo(DataMixin, CreateView):
    form_class = AddMedHistory
    template_name = 'main/add_info.html'
    success_url = reverse_lazy('home')
    title_page = 'Добавить информацию'



def contact(request):
    return HttpResponse("Контакты для связи")

def registration(request):
    return HttpResponse("Страница регистрации")

def login(request):
    return HttpResponse("Страница авторизации")


class ShowCards(DataMixin, ListView):
    model = Patients
    template_name = 'main/cards.html'
    context_object_name = 'cards'
    title_page = 'Карточки'



class ShowCard(DataMixin, ListView):
    model = Patients
    template_name = 'main/card.html'
    pk_url_kwarg = 'card_id'
    context_object_name = 'card'

    def get_object(self):
        return get_object_or_404(Patients, pk=self.kwargs[self.pk_url_kwarg])

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        card = self.get_object()  # Получаем объект card
        context['card'] = card
        context['title'] = card.title
        context['med_history'] = MedHistory.objects.filter(patient=card)  # Получаем связанную историю болезни
        return self.get_mixin_context(context)



def page_not_found(request, exception):
    return HttpResponseNotFound('<h1>Страница не найдена</h1>')

def process_zip(request):
    print('function process_zip processing...')
    if request.method == 'POST':
        try:
            # Получаем загруженный файл
            uploaded_file = request.FILES.get('file')
            if not uploaded_file.name.endswith('.zip'):
                return JsonResponse({'success': False, 'error': 'Файл должен быть ZIP-архивом'})

            # Сохраняем временный файл
            zip_path = f'/tmp/{uploaded_file.name}'
            with open(zip_path, 'wb') as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)

            # Извлекаем архив
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                extracted_path = f'/tmp/extracted_{uploaded_file.name}'
                zip_ref.extractall(extracted_path)

                # Анализ содержимого архива
                fio_s = []
                file_data = []
                for root, dirs, files in os.walk(extracted_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        # Чтение метаданных файла
                        file_info = {
                            'name': file,
                            'size': os.path.getsize(file_path),
                            'modified': os.path.getmtime(file_path),
                        }

                        # Пример: если файл - текстовый, читаем его содержимое
                        '''if file.endswith('.txt'):
                            with open(file_path, 'r', encoding='utf-8') as f:
                                file_info['content'] = f.read()'''

                        fio = os.path.splitext(file)[0]

                        if re.search(r'(?:^|[ \-_])([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)?[ \-_][а-яА-ЯёЁ]+[ \-_][а-яА-ЯёЁ]+(?:ович|евич|овна|евна|ична|инична))', fio):
                            fio_s.append(fio)

                        file_data.append(file_info)

                # Взаимодействие с базой данных
                '''for file_info in file_data:
                    fio = os.path.splitext(file_info['name'])[0]  # Имя файла без расширения
                    patient, created = Patients.objects.get_or_create(full_name=fio)
                    MedHistory.objects.create(
                        patient=patient,
                        file_name=file_info['name']
                    )'''

                fio_s = list(set(fio_s))
                if len(fio_s) == 1:
                    patient, created = Patients.objects.get_or_create(title=fio_s[0])


            # Удаляем временные файлы
            os.remove(zip_path)
            os.rmdir(extracted_path)

            return JsonResponse({'success': True, 'result': file_data})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Метод запроса должен быть POST'})