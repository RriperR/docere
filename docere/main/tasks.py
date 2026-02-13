import os
import zipfile
import tempfile
from collections import Counter

from celery import shared_task
from django.db import transaction
from django.utils import timezone
from django.core.files import File as DjangoFile

from .models import ArchiveJob, Patient, MedicalRecord, LabFile
from .utils import decode_filename, extract_fio, extract_dob, extract_phone, extract_email


@shared_task(bind=True)
def process_zip_task(self, job_id):
    print("Begining of celery working!!")
    job = ArchiveJob.objects.get(pk=job_id)
    # 1) Помечаем начало обработки
    job.status = 'processing'
    job.log = (job.log or '') + 'Start processing\n'
    job.save(update_fields=['status', 'log'])

    tmpdir = tempfile.mkdtemp()
    try:
        # 2) Распаковка архива с декодом имён и безопасным извлечением
        with zipfile.ZipFile(job.archive_file.path, 'r') as zf:
            for info in zf.infolist():
                try:
                    decoded = decode_filename(info.filename)
                except Exception:
                    decoded = info.filename

                dest_path = os.path.abspath(os.path.join(tmpdir, decoded))
                if not dest_path.startswith(os.path.abspath(tmpdir)):
                    continue

                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                zf.extract(info, tmpdir)

                # переименовываем, если zf.extract сохранил старое имя
                orig = os.path.join(tmpdir, info.filename)
                if os.path.exists(orig) and orig != dest_path:
                    os.replace(orig, dest_path)

        # 3) Сбор «сырых» данных из имён файлов
        all_fios, all_dobs, all_phones, all_emails = [], [], [], []
        file_count = 0
        for root, _, files in os.walk(tmpdir):
            for fname in files:
                file_count += 1
                name_only, _ = os.path.splitext(fname)
                all_fios.extend(extract_fio(name_only))
                all_dobs.extend(extract_dob(name_only))
                all_phones.extend(extract_phone(name_only))
                all_emails.extend(extract_email(name_only))

        # 4) Сохраняем raw_extracted и логируем
        job.raw_extracted = {
            'fios':   all_fios,
            'dobs':   all_dobs,
            'phones': all_phones,
            'emails': all_emails,
        }
        job.log += (
            f'Extracted {len(all_fios)} fio(s), '
            f'{len(all_dobs)} date(s), '
            f'{len(all_phones)} phone(s), '
            f'{len(all_emails)} email(s)\n'
        )
        job.save(update_fields=['raw_extracted', 'log'])

        # Если ФИО нет — сразу завершаем задачку с ошибкой,
        # MedicalRecord не создаём
        if not all_fios:
            job.status = 'failed'
            job.completed_at = timezone.now()
            job.log += 'No FIO found; aborting processing\n'
            job.save(update_fields=['status', 'completed_at', 'log'])
            return

        # 5) Выбор самого частого ФИО → Patient и привязка к доктору
        main = Counter(all_fios).most_common(1)
        patient = None
        if main:
            fio = main[0][0]
            parts = fio.split()
            patient = Patient.objects.filter(
                last_name__iexact=parts[0] if parts else '',
                first_name__iexact=parts[1] if len(parts) > 1 else ''
            ).first()
            if not patient:
                patient = Patient.objects.create(
                    last_name=parts[0] if parts else '',
                    first_name=parts[1] if len(parts) > 1 else '',
                    middle_name=parts[2] if len(parts) > 2 else None,
                )
            job.log += f'Patient chosen: {fio}\n'
            job.save(update_fields=['log'])

            # Привязываем пациента к доктору (uploaded_by → doctor_profile)
            doctor = getattr(job.uploaded_by, 'doctor_profile', None)
            if doctor:
                patient.doctors.add(doctor)
                job.log += f'Patient linked to Doctor #{doctor.id}\n'
                job.save(update_fields=['log'])
        else:
            job.log += 'No FIO found; patient not set\n'
            job.save(update_fields=['log'])

        # 6) Создание MedicalRecord + LabFile
        with transaction.atomic():
            record = MedicalRecord.objects.create(
                patient=patient,
                doctor=getattr(job.uploaded_by, 'doctor_profile', None),
                created_by=job.uploaded_by,
                appointment_location='',
                notes='',
                visit_date=None,
            )
            created_files = 0
            for root, _, files in os.walk(tmpdir):
                for fname in files:
                    path = os.path.join(root, fname)
                    ftype = 'photo' if fname.lower().endswith(('.png', '.jpg', '.jpeg')) else 'ct_scan'
                    with open(path, 'rb') as f:
                        df = DjangoFile(f)
                        lab = LabFile.objects.create(
                            record=record,
                            file_type=ftype,
                            uploaded_by=job.uploaded_by,
                        )
                        lab.file.save(fname, df, save=True)
                        created_files += 1

            job.record = record
            job.log += f'Created record #{record.id} with {created_files} files\n'
            job.save(update_fields=['record', 'log'])

        # 7) Завершение задачи успешно
        job.status = 'done'
        job.completed_at = timezone.now()
        job.log += 'Processing finished successfully\n'
        job.save(update_fields=['status', 'completed_at', 'log'])

    except Exception as e:
        job.status = 'failed'
        job.completed_at = timezone.now()
        job.log += f'Error: {str(e)}\n'
        job.save(update_fields=['status', 'completed_at', 'log'])
        raise

    finally:
        try:
            import shutil
            shutil.rmtree(tmpdir)
        except Exception:
            pass
