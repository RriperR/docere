import tempfile
import os

from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from celery.result import AsyncResult

from .models import Patient, MedHistory
from .serializers import UserSerializer, PatientSerializer, MedHistorySerializer, ZipUploadSerializer
from main.tasks import process_zip_task


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class PatientListCreate(generics.ListCreateAPIView):
    serializer_class = PatientSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return Patient.objects.all()

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save()
        else:
            print(serializer.errors)


class PatientDelete(generics.DestroyAPIView):
    serializer_class = PatientSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return Patient.objects.all()


class PatientCardAPIView(generics.RetrieveAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = (AllowAny,)
    lookup_url_kwarg = 'card_id'

    def retrieve(self, request, *args, **kwargs):
        patient = get_object_or_404(Patient, pk=self.kwargs.get(self.lookup_url_kwarg))
        patient_serializer = self.get_serializer(patient)
        med_history = MedHistory.objects.filter(patient=patient)
        med_history_serializer = MedHistorySerializer(med_history, many=True)

        return Response({
            'patient': patient_serializer.data,
            'med_history': med_history_serializer.data
        })


from django.conf import settings
import os

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
