from django.utils import timezone
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
    phone = models.CharField(unique=True, max_length=20, blank=True, null=True, verbose_name="Номер телефона")
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name="Электронная почта")
    birthday = models.DateField(blank=True, null=True, verbose_name="Дата рождения")
    photo = models.ImageField(upload_to="photos/%Y/%m/%d", blank=True, null=True, verbose_name='Фото')
    time_create = models.DateTimeField(auto_now_add=True)
    time_update = models.DateTimeField(auto_now=True)

    def get_full_name(self) -> str:
        """
        Возвращает Фамилия Имя Отчество, склеивая поля
        """
        parts = []
        if self.last_name:
            parts.append(self.last_name)
        if self.first_name:
            parts.append(self.first_name)
        if self.middle_name:
            parts.append(self.middle_name)
        return " ".join(parts)

    @property
    def full_name(self) -> str:
        return self.get_full_name()

    def __str__(self):
        return self.full_name


class PersonBase(models.Model):
    first_name  = models.CharField('Имя',    max_length=150)
    last_name   = models.CharField('Фамилия',max_length=150)
    middle_name = models.CharField('Отчество', max_length=150, blank=True, null=True)

    class Meta:
        abstract = True

    def get_full_name(self) -> str:
        parts = [self.last_name, self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        return " ".join(filter(None, parts))


class Patient(PersonBase):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='patients'  # имя для user.patients.all()
    )
    birthday = models.DateField('Дата рождения', blank=True, null=True)
    phone    = models.CharField(blank=True, null=True, max_length=20)
    email    = models.EmailField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Пациент {self.get_full_name()}'


class Doctor(PersonBase):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_profile"
    )
    specialization = models.CharField(max_length=200, blank=True, null=True)
    institution    = models.CharField(max_length=200, blank=True, null=True)
    patients       = models.ManyToManyField('Patient', related_name="doctors")

    def __str__(self):
        return f"Доктор {self.get_full_name()}"


class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_profile")

    def __str__(self):
        return f"Админ {self.user.email}"


class ArchiveJob(models.Model):
    STATUS_CHOICES = [
        ('pending',    'В ожидании'),
        ('processing', 'Обрабатывается'),
        ('failed',     'Ошибка'),
        ('done',       'Готово'),
    ]

    uploaded_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='archive_jobs'
    )
    uploaded_at   = models.DateTimeField(auto_now_add=True)
    completed_at  = models.DateTimeField(null=True, blank=True, verbose_name="Когда закончилась обработка")
    status        = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    log           = models.TextField(blank=True)
    archive_file  = models.FileField(upload_to='archives/%Y/%m/%d/', max_length=500)

    # сырые данные разбора
    raw_extracted = models.JSONField(
        default=dict,
        blank=True,
        help_text="Сырые данные разбора архива (все найденные ФИО, даты, телефоны, e-mail и т.п.)"
    )

    # ссылка на финальный MedicalRecord
    record = models.ForeignKey(
        'MedicalRecord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archive_job'
    )

    class Meta:
        ordering = ['-uploaded_at']


class LabFile(models.Model):
    record     = models.ForeignKey('MedicalRecord', on_delete=models.CASCADE, related_name='files')
    file_type  = models.CharField(max_length=20, choices=[('photo','Фото'),('ct_scan','КТ')])
    file       = models.FileField(upload_to='records/%Y/%m/%d/')
    metadata   = models.JSONField(blank=True, null=True)  # EXIF, DICOM-теги и т.п.

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)


class MedicalRecord(models.Model):
    patient = models.ForeignKey(
        'Patient',
        on_delete=models.CASCADE,
        related_name='medical_records',
        null=True, blank=True
    )
    doctor = models.ForeignKey(
        'Doctor',
        on_delete=models.CASCADE,
        related_name='medical_records',
        null=True, blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_medical_records'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    appointment_location = models.TextField(blank=True)
    notes     = models.TextField(blank=True)
    visit_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-visit_date', '-created_at']

    def __str__(self):
        return f"Record #{self.id}"


class ShareRequest(models.Model):
    STATUS_PENDING  = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_CHOICES  = [
        (STATUS_PENDING,  'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
    ]

    from_user  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='sent_shares',
        on_delete=models.CASCADE
    )
    to_user    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='received_shares',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    to_email   = models.EmailField(
        max_length=254,
        help_text="Email того, с кем хотим поделиться"
    )
    patient    = models.ForeignKey(
        'main.Patient',
        related_name='share_requests',
        on_delete=models.CASCADE
    )

    status       = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('to_email', 'patient')

    def accept(self):
        # Привязываем patient.user к to_user
        self.patient.user = self.to_user
        self.patient.save(update_fields=['user'])
        self.status       = self.STATUS_ACCEPTED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])

    def decline(self):
        self.status       = self.STATUS_DECLINED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])
