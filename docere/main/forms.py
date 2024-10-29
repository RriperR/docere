from django import forms
from phonenumber_field.formfields import PhoneNumberField

from main.models import Patients, MedHistory


class AddPatientForm(forms.ModelForm):
    class Meta:
        model = Patients
        fields = ['title', 'phone', 'photo']

# class AddMedHistoryForm(forms.ModelForm):
#     class Meta:
#         model = MedHistory
#         fields = '__all__'


class UploadFileForm(forms.ModelForm):
    class Meta:
        model = MedHistory
        fields = '__all__'
    file = forms.FileField(label="Файл", required=False)