from django.urls import reverse
from django.conf import settings
from django.db import models


class Patient(models.Model):
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
    patient = models.ForeignKey('Patient', on_delete=models.PROTECT, verbose_name="Пациент")

    doctor_name = models.CharField(max_length=255, verbose_name="ФИО доктора")
    doctor_specialization = models.CharField(max_length=255, verbose_name="Специальность доктора")
    appointment_location = models.CharField(max_length=255, verbose_name="Место прохождения приёма")
    institution_specialization = models.CharField(max_length=255, verbose_name="Специализация мед учреждения")
    lab_data = models.FileField(upload_to="lab_data/files/%Y/%m/%d", blank=True, null=True, verbose_name="Лабораторные данные (файлы)")

    def __str__(self):
        return self.time_create


class LabFile(models.Model):
    med_history = models.ForeignKey(MedHistory, related_name='files', on_delete=models.CASCADE)
    file = models.FileField(upload_to="lab_data/files/%Y/%m/%d")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name


class UploadFiles(models.Model):
    file = models.FileField(upload_to='uploads_model/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Пользователь"
    )

    def __str__(self):
        user = self.uploaded_by if self.uploaded_by else "Аноним"
        return f"{self.file.name} загружен {user} {self.uploaded_at:%Y-%m-%d %H:%M}"