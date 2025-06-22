from django.urls import path

from . import views

app_name = 'main'

urlpatterns = [
    path('user/register/', views.CreateUserView.as_view(), name='user-register'),
    path('user/me/', views.UserMeView.as_view(), name='user-me'),
    path('patients/', views.PatientListCreate.as_view(), name='patients-list'),
    path('patients/<int:pk>/', views.PatientRetrieveAPIView.as_view(), name='patients-detail'),
    path('process-zip/', views.ProcessZipView.as_view(), name='process_zip'),
    path('task-status/<int:task_id>/', views.TaskStatusView.as_view(), name='task_status'),
    path('recent-uploads/', views.RecentUploadsAPIView.as_view(), name='recent-uploads'),
    path('doctors/', views.DoctorListAPIView.as_view(), name='doctor-list'),
    path(
      'doctors/<int:doctor_id>/patients/',
      views.DoctorPatientsAPIView.as_view(),
      name='doctor-patients'
    ),
    path(
        'patients/<int:patient_id>/records/',
        views.PatientRecordListAPIView.as_view(),
        name='patient-records'
    ),
]