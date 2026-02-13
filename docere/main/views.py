from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, status, viewsets, parsers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from .models import User, Patient, Doctor, MedicalRecord, ArchiveJob, ShareRequest, LabFile, RecordShare
from .serializers import (UserRegisterSerializer, PatientSerializer, DoctorSerializer,
                          UserMeSerializer, MedicalRecordSerializer, ZipUploadSerializer, ArchiveJobSerializer,
                          RecentUploadSerializer, ShareRequestCreateSerializer, ShareRequestSerializer)
from main.tasks import process_zip_task


class CreateUserView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    queryset           = User.objects.all()
    serializer_class   = UserRegisterSerializer

    def perform_create(self, serializer):
        """
        • Создаём самого `User`
        • Если роль == patient  → сразу же создаём Patient-профиль и привязываем
        """
        user: User = serializer.save()

        if user.role == 'patient':
            # если вдруг перерегистрируются тем же email – карточка уже есть
            Patient.objects.get_or_create(
                user=user,
                defaults={
                    'first_name':  user.first_name,
                    'last_name':   user.last_name,
                    'middle_name': user.middle_name,
                    'birthday':    user.birthday,
                    'email':       user.email,
                    'phone':       user.phone,
                }
            )



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
    """
    GET  /patients/        – список пациентов, доступных текущему юзеру
    POST /patients/        – создать карточку пациента
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    # ─────────────────────────────────────────────────────────────────────────
    # С П И С О К
    # ─────────────────────────────────────────────────────────────────────────
    def get_queryset(self):
        user = self.request.user

        # аноним – пусто
        if not user.is_authenticated:
            return Patient.objects.none()

        # пациент → только своя карточка
        if user.role == 'patient':
            return Patient.objects.filter(user=user)

        # админ / суперюзер → все
        if user.is_superuser or user.role == 'admin':
            return Patient.objects.all()

        # доктор → свои привязанные
        if user.role == 'doctor' and hasattr(user, 'doctor_profile'):
            return user.doctor_profile.patients.all()

        # остальным – пусто
        return Patient.objects.none()

    # ─────────────────────────────────────────────────────────────────────────
    # С О З Д А Н И Е
    # ─────────────────────────────────────────────────────────────────────────
    def perform_create(self, serializer):
        """
        • Доктор  – создаёт «чернового» пациента и автоматически
          привязывает к себе (doctor.patients.add()).
        • Пациент – нельзя
        • Админ    – может создать карточку кому угодно, просто сохраняем.
        • Прочие   – 403.
        """
        user = self.request.user

        # 1) если birthday пришёл пустой строкой – превращаем в None
        data = serializer.validated_data
        if data.get('birthday') in ('', None):
            data['birthday'] = None

        # 2) ветки по ролям ---------------------------------------------------
        # админ или суперюзер
        if user.is_superuser or user.role == 'admin':
            serializer.save()
            return

        # доктор
        if user.role == 'doctor':
            patient = serializer.save()
            doctor, _ = Doctor.objects.get_or_create(user=user)
            patient.doctors.add(doctor)
            return

        # пациент
        if user.role == 'patient':
            raise Response(
                {"detail": "У вас уже есть личная карточка пациента."},
                status=status.HTTP_403_FORBIDDEN
            )

        # остальные
        raise Response(
            {"error": "У вас нет прав на добавление пациентов"},
            status=status.HTTP_403_FORBIDDEN
        )


class PatientRetrieveAPIView(generics.RetrieveAPIView):
    """
    GET /patients/<id>/ — возвращает одного пациента по его id.
    Доступен докторам по своим пациентам, админам, и самому пациенту.
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def get_object(self):
        patient = super().get_object()
        user = self.request.user

        # суперюзер/админ может любого
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return patient

        # доктор — только своих
        if getattr(user, 'role', None) == 'doctor':
            doc = getattr(user, 'doctor_profile', None)
            if doc and patient in doc.patients.all():
                return patient

        # пациент — только свои
        if getattr(user, 'role', None) == 'patient':
            if patient.user_id == user.id:
                return patient

        # иначе — 403
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You do not have permission to view this patient.")


class PatientRecordListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /patients/{patient_id}/records/  — список записей
    POST /patients/{patient_id}/records/  — создать новую запись
    """
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        patient = get_object_or_404(Patient, pk=self.kwargs['patient_id'])

        # админы/суперюзеры видят всё
        if user.is_superuser or user.role == 'admin':
            return MedicalRecord.objects.filter(patient=patient)

        base = MedicalRecord.objects.filter(patient=patient)

        # для доктора и пациента одинаковая логика просмотра:
        # — создатель, или второй владелец, или принявший шаринг
        if user.role in ('doctor', 'patient'):
            return base.filter(
                Q(owner_primary=user)
                | Q(owner_second=user)
                | Q(shares__to_user=user, shares__status='accepted')
            ).distinct()

        # остальным — ничего
        return MedicalRecord.objects.none()

    def perform_create(self, serializer):
        # 1. Сохраняем сам MedicalRecord
        patient        = get_object_or_404(Patient, pk=self.kwargs['patient_id'])
        doctor_profile = getattr(self.request.user, 'doctor_profile', None)
        record = serializer.save(
            patient=patient,
            owner_primary=self.request.user,
            doctor=doctor_profile
        )

        # 2. Обрабатываем файлы из request.FILES.getlist('files')
        for uploaded in self.request.FILES.getlist('files'):
            # file_type можно вычислить по расширению или принять как отдельное поле
            LabFile.objects.create(
                record=record,
                file=uploaded,
                file_type='photo',            # или 'ct_scan' и т.п.
                uploaded_by=self.request.user
            )

class PatientRecordDetailAPIView(generics.RetrieveUpdateAPIView):
    """
    GET    /patients/{patient_id}/records/{pk}/    — получить одну запись
    PATCH  /patients/{patient_id}/records/{pk}/    — частично обновить запись
    """
    serializer_class   = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [
        parsers.JSONParser,
        parsers.FormParser,
        parsers.MultiPartParser,
    ]

    def get_queryset(self):
        user       = self.request.user
        patient_id = self.kwargs['patient_id']
        patient    = get_object_or_404(Patient, pk=patient_id)

        # 1) суперюзер/админ
        if user.is_superuser or user.role == 'admin':
            return MedicalRecord.objects.filter(patient=patient)

        # 2) пациент — свои записи
        if user.role == 'patient' and patient.user_id == user.id:
            return MedicalRecord.objects.filter(patient=patient)

        # 3) доктор — два случая:
        if user.role == 'doctor' and hasattr(user, 'doctor_profile'):
            doc = user.doctor_profile
            # а) если это «свой» пациент — он может смотреть все
            if patient in doc.patients.all():
                return MedicalRecord.objects.filter(patient=patient)
            # б) если есть шаринг (pending или accepted) — тоже можно посмотреть
            return MedicalRecord.objects.filter(
                patient=patient,
                shares__doctor=doc,
                shares__status__in=['pending', 'accepted']
            )

        # иначе — ни посмотреть, ни изменить
        return MedicalRecord.objects.none()

    def perform_update(self, serializer):
        # 1) сохраняем изменения полей notes, visit_date, appointment_location
        record = serializer.save()
        # 2) обрабатываем новые файлы (добавляем к уже существующим)
        for f in self.request.FILES.getlist('files'):
            LabFile.objects.create(
                record=record,
                file=f,
                file_type='photo',
                uploaded_by=self.request.user
            )



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



class ProcessZipView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1) Сериализуем пришедший файл
        serializer = ZipUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 2) Создаём ArchiveJob
        job: ArchiveJob = serializer.save(
            uploaded_by=request.user,
            status='pending'
        )

        # 3) Запускаем Celery-таск по job.id
        process_zip_task.delay(job.id)

        # 4) Отдаём клиенту job_id
        return Response({'job_id': job.id}, status=status.HTTP_202_ACCEPTED)


class TaskStatusView(APIView):
    def get(self, request, task_id):
        job = get_object_or_404(ArchiveJob, pk=task_id)
        serializer = ArchiveJobSerializer(job)
        return Response(serializer.data)



class RecentUploadsAPIView(generics.ListAPIView):
    serializer_class   = RecentUploadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # берем свои задания, отсортированные по времени загрузки (новые — первыми)
        return ArchiveJob.objects.filter(
            uploaded_by=self.request.user
        ).order_by('-uploaded_at')[:10]


class ShareRequestViewSet(viewsets.ModelViewSet):
    """
    GET  /share-requests/             — список входящих+исходящих шарингов
    POST /share-requests/             — создать новый ShareRequest
    POST /share-requests/{id}/respond/ — принять/отклонить весь пакет шаринга
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # и входящие, и исходящие
        return ShareRequest.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return ShareRequestCreateSerializer
        return ShareRequestSerializer

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        share = ser.save()
        return Response(
            ShareRequestSerializer(share, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """
        Принять/отклонить весь ShareRequest.
        Ожидает в body JSON { "accepted": true|false }
        """
        share = get_object_or_404(ShareRequest, pk=pk)
        # только адресат может отвечать
        if share.to_user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        if bool(request.data.get('accepted', False)):
            share.accept()
        else:
            share.decline()

        return Response(
            ShareRequestSerializer(share, context={'request': request}).data
        )

class RecordShareRespondAPIView(APIView):
    """
    POST /record-shares/{pk}/respond/
    body: { "action": "accept"|"decline" }
    Принимать/отклонять можно только тот, кому шарилась конкретная запись (to_user).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        rs = get_object_or_404(RecordShare, pk=pk)
        user = request.user

        # только адресат
        if rs.to_user != user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')
        if action == 'accept':
            rs.accept()
        else:
            rs.decline()

        return Response({'status': action}, status=status.HTTP_200_OK)