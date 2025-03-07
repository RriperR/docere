from django.urls import path
from . import views
from . import file_processing

urlpatterns = [
    path('api/cards/', views.PatientListCreate.as_view(), name='cards-list'),
    path('api/cards/delete/<int:pk>/', views.PatientDelete.as_view(), name='delete-card'),
    path('api/card/<int:card_id>', views.PatientCardAPIView.as_view(), name='card'),

    path('process-zip/', file_processing.process_zip, name='process_zip'),
    path('confirm-fio/', file_processing.confirm_fio, name='confirm_fio'),
]