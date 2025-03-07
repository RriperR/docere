from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Patient, MedHistory
from .serializers import UserSerializer, PatientSerializer, MedHistorySerializer


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
