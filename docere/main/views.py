from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render

def index(request):
    return render(request, 'main/index.html')

def about(request):
    return render(request, 'main/about.html')

def categories(request, cat_id):
    return HttpResponse(f"<h1>page of Categories</h1><p>id: {cat_id}</p>")


data_db = [
    {'id':1, 'fullname' : 'Магомедов Магомед Магомедович', 'phone' : '+71234567890'},
    {'id':2, 'fullname' : 'Саидов Саид Саидович', 'phone' : '+73456347345'},
    {'id':3, 'fullname' : 'Гаджиев Гаджи Гаджиевич', 'phone' : '+734563457'},
]

def show_cards(request):
    data = {
        'cards':data_db
    }
    return render(request, 'main/cards.html', context=data)

def page_not_found(request, exception):
    return HttpResponseNotFound('<h1>Страница не найдена</h1>')