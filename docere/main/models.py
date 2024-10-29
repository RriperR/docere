from django.urls import reverse

from django.db import models

class Patients(models.Model):
    title = models.CharField(max_length=255, verbose_name="ФИО")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Номер телефона", null=True)
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

    def __str__(self):
        return self.time_create

class UploadFiles(models.Model):
    file  = models.FileField(upload_to='uploads_model')