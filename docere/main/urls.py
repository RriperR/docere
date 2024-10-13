from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='home'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('registration/', views.registration, name='registration'),
    path('login/', views.login, name='login'),
    path('cards/', views.show_cards, name='cards'),
    path('card/<int:card_id>', views.show_card, name='card'),
]