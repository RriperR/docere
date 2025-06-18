import os

from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from celery.result import AsyncResult

from .models import User, Patient, Doctor, MedicalRecord
from .serializers import (UserRegisterSerializer, PatientSerializer, DoctorSerializer,
                          UserMeSerializer, MedicalRecordSerializer)
from main.tasks import process_zip_task


class CreateUserView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserMeSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientListCreate(generics.ListCreateAPIView):
    serializer_class = PatientSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or user.role == 'patient':
            return Patient.objects.none()
        if user.is_superuser or user.role == "admin":
            return Patient.objects.all()
        # доктор
        return Patient.objects.filter(doctors=user.doctor_profile)

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_superuser or user.role == "admin" or user.role == "doctor":
            patient = serializer.save()

            # Если доктор создаёт пациента – автоматически прикрепляем его
            if user.role == "doctor":
                doctor, _ = Doctor.objects.get_or_create(user=user)  # Создаём, если нет
                patient.doctors.add(doctor)

            return patient
        else:
            return Response({"error": "У вас нет прав на добавление пациентов"}, status=403)


class PatientDelete(generics.DestroyAPIView):
    serializer_class = PatientSerializer

    def get_queryset(self):
        return Patient.objects.all()


class ProcessZipView(APIView):
    def post(self, request):
        serializer = ZipUploadSerializer(data=request.data)
        if serializer.is_valid():
            uploaded_file = serializer.validated_data['file']

            # Сохраняем архив в `media/archives`
            temp_dir = os.path.join(settings.MEDIA_ROOT, "archives")
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, uploaded_file.name)

            with open(temp_path, "wb") as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)

            print(f"Файл сохранён в: {temp_path}")  # Логирование

            # Отправляем задачу в Celery
            task = process_zip_task.delay(temp_path)

            return Response({'success': True, 'task_id': task.id}, status=status.HTTP_202_ACCEPTED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskStatusView(APIView):
    def get(self, request, task_id):
        result = AsyncResult(task_id)
        return Response({
            'task_id': task_id,
            'status': result.status,
            'result': result.result if result.ready() else None
        })


class DoctorListAPIView(generics.ListAPIView):
    """
    GET /doctors/ — возвращает всех докторов.
    Доступен любому аутентифицированному пользователю
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]


class DoctorPatientsAPIView(generics.ListAPIView):
    """
    GET /doctors/{doctor_id}/patients/ — возвращает пациентов конкретного доктора.
    Доступен самому доктору (его ID) и администраторам.
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        doctor = get_object_or_404(Doctor, pk=self.kwargs['doctor_id'])
        user = self.request.user

        # суперюзер и админ видят всех
        if user.is_superuser or user.role == 'admin':
            return doctor.patients.all()
        # доктор видит только своих пациентов
        if user.role == 'doctor' and hasattr(user, 'doctor_profile') and user.doctor_profile.id == doctor.id:
            return doctor.patients.all()
        # прочим — пустой список
        return Patient.objects.none()


class PatientRecordListAPIView(generics.ListAPIView):
    """
    GET /patients/{patient_id}/records/
    Врач видит записи только своего пациента,
    пациент — только свои собственные.
    """
    serializer_class   = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user       = self.request.user
        patient_id = self.kwargs['patient_id']

        # Убедимся, что пациент существует
        patient = get_object_or_404(Patient, pk=patient_id)

        # Если админ — всё ок
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return MedicalRecord.objects.filter(patient=patient)

        # Врач может смотреть только своих пациентов
        if getattr(user, 'role', None) == 'doctor':
            # проверяем ManyToMany связь через related_name="doctors"
            doctor_profile = getattr(user, 'doctor_profile', None)
            if doctor_profile and patient in doctor_profile.patients.all():
                return MedicalRecord.objects.filter(patient=patient)

        # Пациент может смотреть только свою карточку
        if getattr(user, 'role', None) == 'patient':
            # связанный Patient через OneToOne
            patient_profile = getattr(user, 'patient_profile', None)
            if patient_profile and patient_profile.id == patient.id:
                return MedicalRecord.objects.filter(patient=patient)

        # всем остальным — пусто
        return MedicalRecord.objects.none()
