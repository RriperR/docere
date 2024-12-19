from django.urls import reverse

from django.db import models

from utils.file_processing import is_image, generate_thumbnail_base64

class Patients(models.Model):
    title = models.CharField(max_length=255, verbose_name="ФИО")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Номер телефона", null=True)
    email = models.EmailField(max_length=255, blank=True, null=True, verbose_name="Электронная почта")
    age = models.PositiveIntegerField(blank=True, null=True, verbose_name="Возраст")
    photo = models.ImageField(upload_to="photos/%Y/%m/%d", default=None, blank=True, null=True, verbose_name='Фото')
    time_create = models.DateTimeField(auto_now_add=True)
    time_update = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('card', kwargs={'card_id' : self.pk})


class MedHistory(models.Model):
    content = models.TextField(blank=True, verbose_name="Диагноз")
    time_create = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=True, verbose_name="Опубликовать")
    patient = models.ForeignKey('Patients', on_delete=models.PROTECT, verbose_name="Пациент")

    doctor_name = models.CharField(max_length=255, verbose_name="ФИО доктора")
    doctor_specialization = models.CharField(max_length=255, verbose_name="Специальность доктора")
    appointment_location = models.CharField(max_length=255, verbose_name="Место прохождения приёма")
    institution_specialization = models.CharField(max_length=255, verbose_name="Специализация мед учреждения")
    lab_data = models.FileField(upload_to="lab_data/files/%Y/%m/%d", blank=True, null=True, verbose_name="Лабораторные данные (файлы)")

    def get_thumbnail(self, size=(100, 100)):
        """
        Динамическая генерация миниатюры.
        """
        if self.lab_data and is_image(self.lab_data):
            return generate_thumbnail_base64(self.lab_data, size)
        return None


    def __str__(self):
        return self.time_create

class UploadFiles(models.Model):
    file  = models.FileField(upload_to='uploads_model')