from django import forms
from phonenumber_field.formfields import PhoneNumberField

from main.models import Patients, MedHistory, UploadFiles


class AddPatientForm(forms.ModelForm):
    class Meta:
        model = Patients
        fields = ['title', 'phone', 'photo']


class AddMedHistory(forms.ModelForm):
    class Meta:
        model = MedHistory
        fields = '__all__'
    file = forms.FileField(label="Файл", required=False)

class UploadFileForm(forms.ModelForm):
    class Meta:
        model = UploadFiles
        fields = '__all__'
    file = forms.FileField(label="Файл", required=False)