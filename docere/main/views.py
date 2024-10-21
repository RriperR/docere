from audioop import reverse
from lib2to3.fixes.fix_input import context

from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, get_object_or_404, redirect
from django.template.defaultfilters import title
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import ListView, DetailView, FormView

from .forms import UploadFileForm, AddPatientForm
from .models import Patients, UploadFiles

menu = [
    {'title' : 'Добавить пациента', 'url_name' : 'add_patient'},
    {'title' : 'О сайте', 'url_name' : 'about'},
    {'title' : 'Обратная связь', 'url_name' : 'contact'},
    {'title' : 'Зарегистрироваться', 'url_name' : 'registration'},
    {'title' : 'Войти', 'url_name' : 'login'},
]


def index(request):
    data = {
        'title': 'Главная страница',
        'menu': menu,
        'current_year': '2024'
    }
    return render(request, 'main/index.html', data)


def about(request):
    data = {
        'title' : 'О сайте',
        'menu': menu,
    }
    return render(request, 'main/about.html', data)


# def add_patient(request):
#     if request.method == 'POST':
#         form = AddPatientForm(request.POST, request.FILES)
#         if form.is_valid():
#             form.save()
#             return redirect('home')
#     else:
#         form = AddPatientForm()
#
#     data = {
#         'title': 'Добавить пациента',
#         'menu': menu,
#         'form': form,
#     }
#     return render(request, 'main/add_patient.html', data)

class AddPatient(FormView):
    form_class = AddPatientForm
    template_name = 'main/add_patient.html'
    success_url = reverse_lazy('home')

    extra_context = {
        'menu':menu,
        'title':'Добавить пациента',
    }

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)

def contact(request):
    return HttpResponse("Контакты для связи")

def registration(request):
    return HttpResponse("Страница регистрации")

def login(request):
    return HttpResponse("Страница авторизации")

# def show_cards(request):
#     cards = Patients.objects.all()
#     data = {
#         'cards':cards,
#         'menu': menu,
#     }
#     return render(request, 'main/cards.html', context=data)


class ShowCards(ListView):
    model = Patients
    template_name = 'main/cards.html'
    context_object_name = 'cards'
    extra_context = {'menu':menu}


# def show_card(request, card_id):
#     card = get_object_or_404(Patients, pk=card_id)
#
#     if request.method == 'POST':
#         form = UploadFileForm(request.POST, request.FILES)
#         if form.is_valid():
#             fp = UploadFiles(file=form.cleaned_data['file'])
#             fp.save()
#     else:
#         form = UploadFileForm()
#
#     data = {
#         'title': card.title,
#         "menu": menu,
#         'card': card,
#         'form':form,
#     }
#
#     return render(request, 'main/card.html', context=data)

class ShowCard(FormView):
    model = Patients
    template_name = 'main/card.html'
    pk_url_kwarg = 'card_id'
    context_object_name = 'card'
    form_class = UploadFileForm
    success_url = reverse_lazy('home')

    def get_object(self):
        """Получает объект на основе pk_url_kwarg."""
        return get_object_or_404(Patients, pk=self.kwargs[self.pk_url_kwarg])

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        card = self.get_object()  # Получаем объект card
        context['card'] = card  # Добавляем его в контекст
        context['title'] = card.title
        context['menu'] = menu  # Убедитесь, что `menu` определен или импортирован
        return context


    def form_valid(self, form):
        form.save()
        return super().form_valid(form)

def page_not_found(request, exception):
    return HttpResponseNotFound('<h1>Страница не найдена</h1>')