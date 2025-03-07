from rest_framework import serializers
from django.contrib.auth.models import User

from main.models import Patient, MedHistory


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ["id", "title", "phone", "email", "age"]


class MedHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedHistory
        fields = '__all__'