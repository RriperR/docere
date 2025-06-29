# main/models.py
from django.conf        import settings
from django.contrib.auth.models import AbstractUser
from django.db          import models
from django.utils       import timezone


# ---------- Пользователь ----------------------------------------------------
class User(AbstractUser):
    ROLE_CHOICES = [
        ('doctor',  'Doctor'),
        ('patient', 'Patient'),
        ('admin',   'Admin'),
    ]
    role         = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')

    middle_name  = models.CharField(max_length=150, blank=True, null=True)
    phone        = models.CharField(max_length=20, unique=True,  blank=True, null=True)
    email        = models.EmailField(unique=True, blank=True, null=True)
    birthday     = models.DateField(blank=True, null=True)
    photo        = models.ImageField(upload_to='photos/%Y/%m/%d', blank=True, null=True)

    time_create  = models.DateTimeField(auto_now_add=True)
    time_update  = models.DateTimeField(auto_now=True)

    # ― helpers ― -----------------------------------------------------------
    def get_full_name(self) -> str:
        parts = [self.last_name or '', self.first_name or '', self.middle_name or '']
        return " ".join(p for p in parts if p)

    @property
    def full_name(self) -> str:     # удобный alias
        return self.get_full_name()

    def __str__(self):
        return self.full_name or self.username


# ---------- базовый «человек» ----------------------------------------------
class PersonBase(models.Model):
    first_name  = models.CharField('Имя',      max_length=150)
    last_name   = models.CharField('Фамилия',  max_length=150)
    middle_name = models.CharField('Отчество', max_length=150, blank=True, null=True)

    class Meta:
        abstract = True

    def get_full_name(self):
        return " ".join(p for p in [self.last_name, self.first_name, self.middle_name] if p)


# ---------- Пациент / Доктор / Админ ---------------------------------------
class Patient(PersonBase):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='patient_profile'
    )
    birthday    = models.DateField(blank=True, null=True)
    phone       = models.CharField(max_length=20, blank=True, null=True)
    email       = models.EmailField(blank=True, null=True)

    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Пациент {self.get_full_name()}'


class Doctor(PersonBase):
    user          = models.OneToOneField(settings.AUTH_USER_MODEL,
                                         related_name='doctor_profile',
                                         on_delete=models.CASCADE)
    specialization = models.CharField(max_length=200, blank=True, null=True)
    institution    = models.CharField(max_length=200, blank=True, null=True)

    # «свои» пациенты ― заполняем при первом создании записи или вручную
    patients       = models.ManyToManyField(Patient, related_name='doctors', blank=True)

    def __str__(self):
        return f'Доктор {self.get_full_name()}'


class Admin(models.Model):
    user = models.OneToOneField(User, related_name='admin_profile', on_delete=models.CASCADE)
    def __str__(self):
        return f'Админ {self.user.email}'


# ---------- Мед-запись + файлы ---------------------------------------------
class MedicalRecord(models.Model):
    VIS_CHOICES = [('draft', 'Draft'), ('shared', 'Shared')]
    visibility   = models.CharField(max_length=10, choices=VIS_CHOICES, default='draft')

    patient      = models.ForeignKey(Patient, related_name='medical_records',
                                     on_delete=models.CASCADE)
    doctor       = models.ForeignKey(Doctor,  related_name='medical_records',
                                     on_delete=models.CASCADE,
                                     null=True, blank=True)

    owner_primary = models.ForeignKey(settings.AUTH_USER_MODEL,
                                      related_name='records_owned',
                                      on_delete=models.SET_NULL,
                                      null=True, blank=True)
    owner_second  = models.ForeignKey(settings.AUTH_USER_MODEL,
                                      related_name='records_confirmed',
                                      on_delete=models.SET_NULL,
                                      null=True, blank=True)

    created_at   = models.DateTimeField(auto_now_add=True)
    visit_date   = models.DateField(blank=True, null=True)
    appointment_location = models.TextField(blank=True)
    notes        = models.TextField(blank=True)

    class Meta:
        ordering = ['-visit_date', '-created_at']

    # удобное свойство: запись подтверждена?
    @property
    def is_confirmed(self):
        return self.owner_primary_id and self.owner_second_id

    def __str__(self):
        return f'Record {self.id} ({self.visibility})'


class LabFile(models.Model):
    record      = models.ForeignKey(MedicalRecord, related_name='files', on_delete=models.CASCADE)
    file_type   = models.CharField(max_length=20, choices=[('photo', 'Фото'), ('ct_scan', 'КТ')])
    file        = models.FileField(upload_to='records/%Y/%m/%d/')
    metadata    = models.JSONField(blank=True, null=True)

    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


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


# ---------- Share / Access control -----------------------------------------
class RecordShare(models.Model):
    """
    Конкретная запись расшарена конкретному врачу.
    """
    record   = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE,
                                 related_name='shares')
    doctor   = models.ForeignKey(Doctor, on_delete=models.CASCADE,
                                 related_name='record_shares')

    STATUS   = [('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')]
    status   = models.CharField(max_length=8, choices=STATUS, default='pending')
    created  = models.DateTimeField(auto_now_add=True)
    updated  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('record', 'doctor')
        indexes = [
            models.Index(fields=('doctor', 'status')),
            models.Index(fields=('record', 'status')),
        ]

    def accept(self):
        if self.status != 'accepted':
            # при первом «accept» фиксируем второго владельца
            if not self.record.owner_second_id:
                self.record.owner_second = self.doctor.user
                self.record.visibility   = 'shared'
                self.record.save(update_fields=['owner_second', 'visibility'])
            self.status = 'accepted'
            self.save(update_fields=['status'])

    def decline(self):
        self.delete()


# ---------- Уведомление ----------------------------------
class ShareRequest(models.Model):
    """
    Просто «конверт»-уведомление. Ссылается на множество RecordShare.
    """
    from_user  = models.ForeignKey(settings.AUTH_USER_MODEL,
                                   related_name='sent_shares',
                                   on_delete=models.CASCADE)
    to_email   = models.EmailField()          # кому
    to_user    = models.ForeignKey(settings.AUTH_USER_MODEL,
                                   null=True, blank=True,
                                   related_name='received_shares',
                                   on_delete=models.CASCADE)
    patient    = models.ForeignKey(Patient, on_delete=models.CASCADE)

    record_shares = models.ManyToManyField(RecordShare, blank=True)

    STATUS = [('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')]
    status       = models.CharField(max_length=8, choices=STATUS, default='pending')
    created_at   = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('to_email', 'patient')

    # при ответе просто проксируем в RecordShare
    def accept(self):
        for rs in self.record_shares.all():
            rs.accept()
        self.status = 'accepted'
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])

    def decline(self):
        self.status = 'declined'
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])
