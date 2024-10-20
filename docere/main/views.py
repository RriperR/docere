from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, get_object_or_404, redirect

from .forms import UploadFileForm, AddPatientForm
from .models import Patients

menu = [
    {'title' : 'Добавить пациента', 'url_name' : 'add_data'},
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


def add_data(request):
    if request.method == 'POST':
        form = AddPatientForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = AddPatientForm()

    data = {
        'title': 'Добавить пациента',
        'menu': menu,
        'form': form,
    }
    return render(request, 'main/add_patient.html', data)

def contact(request):
    return HttpResponse("Контакты для связи")

def registration(request):
    return HttpResponse("Страница регистрации")

def login(request):
    return HttpResponse("Страница авторизации")

def show_cards(request):
    cards = Patients.objects.all()
    data = {
        'cards':cards,
        'menu': menu,
    }
    return render(request, 'main/cards.html', context=data)


def handle_uploaded_file(f):
    with open(f"uploads/{f.name}", "wb+") as destination:
        for chunk in f.chunks():
            destination.write(chunk)


def show_card(request, card_id):
    card = get_object_or_404(Patients, pk=card_id)

    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            handle_uploaded_file(form.cleaned_data['file'])
    else:
        form = UploadFileForm()

    data = {
        'title': card.title,
        "menu": menu,
        'card': card,
        'form':form,
    }

    return render(request, 'main/card.html', context=data)

def page_not_found(request, exception):
    return HttpResponseNotFound('<h1>Страница не найдена</h1>')