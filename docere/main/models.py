from django.urls import reverse
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
        ('admin', 'Admin')
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')

    middle_name = models.CharField(max_length=150, blank=True, null=True, verbose_name="Отчество")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Номер телефона")
    email = models.EmailField(unique=True, verbose_name="Электронная почта")
    birthday = models.DateField(blank=True, null=True, verbose_name="Дата рождения")
    photo = models.ImageField(upload_to="photos/%Y/%m/%d", blank=True, null=True, verbose_name='Фото')
    time_create = models.DateTimeField(auto_now_add=True)
    time_update = models.DateTimeField(auto_now=True)

    def is_patient(self):
        return self.role == 'patient'

    def is_doctor(self):
        return self.role == 'doctor'

    def is_admin(self):
        return self.role == 'admin'

    def __str__(self):
        return self.username


class Patient(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пользователь"
    )

    def __str__(self):
        return f"Пациент {self.user.full_name if self.user else 'Без пользователя'}"


    def get_absolute_url(self):
        return reverse('card', kwargs={'card_id' : self.pk})


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor_profile")
    patients = models.ManyToManyField("Patient", related_name="doctors")

    def __str__(self):
        return f"Доктор {self.user.full_name}"


class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_profile")

    def __str__(self):
        return f"Админ {self.user.full_name}"


class MedHistory(models.Model):
    patient = models.ForeignKey("Patient", on_delete=models.PROTECT, verbose_name="Пациент")
    doctor = models.ForeignKey("Doctor", on_delete=models.SET_NULL, null=True, verbose_name="Доктор")

    content = models.TextField(blank=True, verbose_name="Диагноз")
    clinic_address = models.CharField(max_length=255, blank=True, verbose_name="Адрес клиники")
    clinic_specialty = models.CharField(max_length=255, blank=True, verbose_name="Специализация клиники")
    lab_data = models.FileField(upload_to="lab_data/files/%Y/%m/%d", blank=True, null=True, verbose_name="Лабораторные данные")
    is_published = models.BooleanField(default=True, verbose_name="Опубликовать")
    time_create = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doctor} -> {self.patient} ({self.time_create})"


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