import os

from rest_framework import serializers

from main.models import Patient, User, Doctor, LabFile, MedicalRecord, ArchiveJob


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
    file_name = serializers.SerializerMethodField()

    class Meta:
        model  = ArchiveJob
        fields = [
            'id',
            'status',
            'log',
            'raw_extracted',
            'uploaded_at',
            'completed_at',
            'record',      # ваш existing
            'file_name',   # ← добавили
        ]

    def get_file_name(self, obj):
        # возвращаем только имя, без пути
        return os.path.basename(obj.archive_file.name or '')
