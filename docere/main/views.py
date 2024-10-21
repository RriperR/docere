from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse_lazy

from django.views.generic import ListView, FormView, CreateView, TemplateView

from .forms import UploadFileForm, AddPatientForm
from .models import Patients, UploadFiles
from .utils import DataMixin

menu = [
    {'title' : 'Добавить пациента', 'url_name' : 'add_patient'},
    {'title' : 'О сайте', 'url_name' : 'about'},
    {'title' : 'Обратная связь', 'url_name' : 'contact'},
    {'title' : 'Зарегистрироваться', 'url_name' : 'registration'},
    {'title' : 'Войти', 'url_name' : 'login'},
]

class MainPage(DataMixin, TemplateView):
    title_page = 'Главная страница'
    template_name = 'main/index.html'

class AboutPage(DataMixin, TemplateView):
    title_page = 'О сайте'
    template_name = 'main/about.html'


class AddPatient(DataMixin, CreateView):
    form_class = AddPatientForm
    template_name = 'main/add_patient.html'
    success_url = reverse_lazy('home')
    title_page = 'Добавить пациента'



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



class ShowCard(DataMixin, CreateView):
    model = Patients
    template_name = 'main/card.html'
    pk_url_kwarg = 'card_id'
    context_object_name = 'card'
    form_class = UploadFileForm
    success_url = reverse_lazy('home')

    def get_object(self):
        return get_object_or_404(Patients, pk=self.kwargs[self.pk_url_kwarg])

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        card = self.get_object()  # Получаем объект card
        context['card'] = card
        context['title'] = card.title
        return self.get_mixin_context(context)



def page_not_found(request, exception):
    return HttpResponseNotFound('<h1>Страница не найдена</h1>')