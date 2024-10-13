from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render
from datetime import datetime

menu = [
    {'title' : 'О сайте', 'url_name' : 'about'},
    {'title' : 'Обратная связь', 'url_name' : 'contact'},
    {'title' : 'Зарегистрироваться', 'url_name' : 'registration'},
    {'title' : 'Войти', 'url_name' : 'login'},
]

data_db = [
    {'id':1, 'fullname' : 'Магомедов Магомед Магомедович', 'phone' : '+71234567890'},
    {'id':2, 'fullname' : 'Саидов Саид Саидович', 'phone' : '+73456347345'},
    {'id':3, 'fullname' : 'Гаджиев Гаджи Гаджиевич', 'phone' : '+734563457'},
]


def index(request):
    data = {
        'title': 'Главная страница',
        'menu': menu,
        'current_year': datetime.now().year
    }
    return render(request, 'main/index.html', data)


def about(request):
    data = {
        'title' : 'О сайте',
        'menu': menu,
    }
    return render(request, 'main/about.html', data)

def contact(request):
    return HttpResponse("Контакты для связи")

def registration(request):
    return HttpResponse("Страница регистрации")

def login(request):
    return HttpResponse("Страница авторизации")

def show_cards(request):
    data = {
        'cards':data_db
    }
    return render(request, 'main/cards.html', context=data)

def show_card(request, card_id):
    return HttpResponse(f"Отображение карточки с id = {card_id}")

def page_not_found(request, exception):
    return HttpResponseNotFound('<h1>Страница не найдена</h1>')