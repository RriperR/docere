from django.urls import path

from . import views

app_name = 'main'

urlpatterns = [
    path('cards/', views.PatientListCreate.as_view(), name='cards-list'),
    path('cards/delete/<int:pk>/', views.PatientDelete.as_view(), name='delete-card'),
    path('card/<int:card_id>', views.PatientCardAPIView.as_view(), name='card'),
    path('process-zip/', views.ProcessZipView.as_view(), name='process_zip'),
    path('task-status/<str:task_id>/', views.TaskStatusView.as_view(), name='task_status'),
    path('user/me/', views.UserMeView.as_view(), name='user-me'),
]