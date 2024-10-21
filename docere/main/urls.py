from django.urls import path
from . import views

urlpatterns = [
    path('', views.MainPage.as_view(), name='home'),
    path('add/', views.AddPatient.as_view(), name='add_patient'),
    path('about/', views.AboutPage.as_view(), name='about'),
    path('contact/', views.contact, name='contact'),
    path('registration/', views.registration, name='registration'),
    path('login/', views.login, name='login'),
    path('cards/', views.ShowCards.as_view(), name='cards'),
    path('card/<int:card_id>', views.ShowCard.as_view(), name='card'),
]