import os

from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import serializers

from main.models import Patient, User, Doctor, LabFile, MedicalRecord, ArchiveJob, ShareRequest, RecordShare


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = (
          'id',
          'email',
          'password',
          'first_name',
          'last_name',
          'middle_name',
          'phone',
          'birthday',
        )

    def create(self, validated_data):
        password     = validated_data.pop('password')
        user = User.objects.create_user(
            username    = validated_data.get('email'),
            email       = validated_data.get('email'),
            password    = password,
            first_name  = validated_data.get('first_name', ''),
            last_name   = validated_data.get('last_name', ''),
            middle_name = validated_data.get('middle_name', None),
            phone       = validated_data.get('phone', None),
            birthday    = validated_data.get('birthday', None),
        )
        return user


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'middle_name',
            'email',
            'phone',
            'birthday',
            'photo',
            'role',
        ]


class PatientSerializer(serializers.ModelSerializer):
    last_visit    = serializers.SerializerMethodField()
    record_count  = serializers.SerializerMethodField()
    photo_url     = serializers.ImageField(source='photo', read_only=True)
    birthday = serializers.DateField(
        required=False, allow_null=True, input_formats=['%Y-%m-%d']
    )

    class Meta:
        model  = Patient
        fields = [
            'id',
            'first_name',
            'last_name',
            'middle_name',
            'birthday',
            'email',
            'phone',
            'photo_url',
            'last_visit',
            'record_count',
        ]

    def get_record_count(self, obj):
        return obj.medical_records.count()

    def get_last_visit(self, obj):
        last = obj.medical_records.order_by('-visit_date').first()
        return last.visit_date if last and last.visit_date else None

    def validate_birthday(self, value):
        """Позволяем прислать пустую строку → None."""
        if value in ('', None):
            return None
        return value

    def create(self, validated_data):
        """
        DRF по-умолчанию вернёт dict, если мы переопределяем поля.
        Возвращаем именно объект Patient.
        """
        return Patient.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field, val in validated_data.items():
            setattr(instance, field, val)
        instance.save()
        return instance


class DoctorSerializer(serializers.ModelSerializer):
    user = UserMeSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'user']

class DoctorInfoSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    photo     = serializers.ImageField(source='user.photo', read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'full_name', 'photo', 'specialization', 'institution']

    def get_full_name(self, obj):

        return obj.get_full_name()


class LabFileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LabFile
        fields = ['id', 'file_type', 'file']


class MedicalRecordSerializer(serializers.ModelSerializer):
    doctor    = DoctorInfoSerializer(read_only=True)
    lab_files = LabFileSerializer(source='files', many=True, read_only=True)

    class Meta:
        model  = MedicalRecord
        fields = [
            'id',
            'visit_date',
            'appointment_location',
            'notes',
            'doctor',
            'lab_files',
        ]


class ZipUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchiveJob
        fields = ['archive_file']


class ArchiveJobSerializer(serializers.ModelSerializer):
    file_name  = serializers.SerializerMethodField()
    record_id  = serializers.IntegerField(source='record.id',          read_only=True)
    patient_id = serializers.IntegerField(source='record.patient.id',  read_only=True)

    class Meta:
        model  = ArchiveJob
        fields = [
            'id',
            'status',
            'log',
            'raw_extracted',
            'uploaded_at',
            'completed_at',
            'record_id',
            'patient_id',
            'file_name',
        ]

    def get_file_name(self, obj):
        return os.path.basename(obj.archive_file.name or '')


class RecentUploadSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    record_id    = serializers.IntegerField(source='record.id', read_only=True)
    patient_id = serializers.SerializerMethodField()
    file_name    = serializers.SerializerMethodField()

    class Meta:
        model = ArchiveJob
        fields = [
            'id',
            'patient_name',
            'file_name',
            'uploaded_at',
            'status',
            'record_id',
            'patient_id',
        ]

    def get_patient_name(self, obj):
        # если запись уже обработана — берем пациента из связанного MedicalRecord
        rec = getattr(obj, 'record', None)
        if rec and rec.patient:
            p = rec.patient
            return f"{p.last_name} {p.first_name}"
        return None

    def get_patient_id(self, obj):
        return obj.record.patient.id if obj.record and obj.record.patient else None

    def get_file_name(self, obj):
        return os.path.basename(obj.archive_file.name or '')


class RecordShareSerializer(serializers.ModelSerializer):
    record_id = serializers.IntegerField(source='record.id', read_only=True)
    doctor_id = serializers.IntegerField(source='doctor.id', read_only=True)
    status    = serializers.CharField(read_only=True)

    class Meta:
        model  = RecordShare
        fields = ['id', 'record_id', 'doctor_id', 'status', 'created', 'updated']


class ShareRequestCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(write_only=True)
    to_email   = serializers.EmailField(write_only=True)
    record_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        help_text="Список ID записей для шаринга"
    )

    class Meta:
        model  = ShareRequest
        fields = ['patient_id', 'to_email', 'record_ids']

    def validate(self, attrs):
        user       = self.context['request'].user
        patient    = get_object_or_404(Patient, pk=attrs['patient_id'])
        record_ids = attrs.get('record_ids', [])

        # проверяем, что все record_ids принадлежат этому patient
        # и что текущий user — primary или second владелец записи
        valid_ids = MedicalRecord.objects.filter(
            Q(owner_primary=user) | Q(owner_second=user),
            patient=patient,
            id__in=record_ids
        ).values_list('id', flat=True)

        invalid = set(record_ids) - set(valid_ids)
        if invalid:
            raise serializers.ValidationError(
                f"Нет прав шарить записи с ID {sorted(invalid)}"
            )

        attrs['patient'] = patient
        return attrs

    def create(self, validated_data):
        from_user  = self.context['request'].user
        patient    = validated_data.pop('patient')
        to_email   = validated_data.pop('to_email')
        record_ids = validated_data.pop('record_ids')

        # получаем пользователя-получателя, если есть
        to_user = User.objects.filter(email__iexact=to_email).first()

        # создаём запрос на шаринг
        share_req = ShareRequest.objects.create(
            from_user=from_user,
            to_user=to_user,
            to_email=to_email,
            patient=patient,
        )

        # создаём или получаем RecordShare для каждой записи
        shares = []
        doctor = getattr(from_user, 'doctor_profile', None)
        for rid in record_ids:
            record = MedicalRecord.objects.get(pk=rid)
            share, _ = RecordShare.objects.get_or_create(
                record=record,
                doctor=doctor
            )
            shares.append(share)

        share_req.record_shares.set(shares)
        return share_req


class ShareRequestSerializer(serializers.ModelSerializer):
    from_user     = serializers.StringRelatedField()
    to_user       = serializers.StringRelatedField(read_only=True)
    patient_name  = serializers.SerializerMethodField()
    record_shares = RecordShareSerializer(many=True, read_only=True)

    class Meta:
        model  = ShareRequest
        fields = [
            'id',
            'from_user',
            'to_email',
            'to_user',
            'patient',
            'patient_name',
            'status',
            'created_at',
            'responded_at',
            'record_shares',
        ]

    def get_patient_name(self, obj):
        return obj.patient.get_full_name()
