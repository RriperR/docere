from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='home'),
    path('cats/<int:cat_id>/', views.categories),
    path('about/', views.about, name='about'),
    path('cards/', views.show_cards, name='cards'),
]