from rest_framework import serializers

from main.models import Patient, MedHistory, LabFile, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
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
    user = UserMeSerializer()

    class Meta:
        model = Patient
        fields = ['id', 'user']


class LabFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabFile
        fields = ['id', 'file', 'uploaded_at']


class MedHistorySerializer(serializers.ModelSerializer):
    files = LabFileSerializer(many=True, read_only=True)

    class Meta:
        model = MedHistory
        fields = '__all__'


MAX_FILE_SIZE_MB = 50

class ZipUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        if not value.name.endswith('.zip'):
            raise serializers.ValidationError("Файл должен быть ZIP-архивом")
        return value

    def validate_file_size(file):
        if file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Файл слишком большой (максимум {MAX_FILE_SIZE_MB}MB)")
        return file
