# main/tasks.py
import os
import zipfile
import tempfile
from collections import Counter
from django.db import transaction
from celery import shared_task
from django.core.files import File as DjangoFile

from .models import ArchiveJob, Patient, Doctor, MedicalRecord, LabFile
from .utils import extract_fio, decode_filename

@shared_task(bind=True)
def process_zip_task(self, job_id):
    job = ArchiveJob.objects.get(pk=job_id)
    job.status = 'processing'
    job.log = (job.log or '') + 'Start processing\n'
    job.save()

    try:
        # Распаковать ZIP
        with tempfile.TemporaryDirectory() as tmpdir:
            with zipfile.ZipFile(job.archive_file.path, 'r') as zf:
                for info in zf.infolist():
                    try:
                        info.filename = decode_filename(info.filename)
                    except Exception:
                        pass
                    dest = os.path.abspath(os.path.join(tmpdir, info.filename))
                    if not dest.startswith(os.path.abspath(tmpdir)):
                        continue
                    zf.extract(info, tmpdir)

            # Собрать все ФИО из имён файлов и названия архива
            names = []
            for root, _, files in os.walk(tmpdir):
                for fname in files:
                    names.extend(extract_fio(fname))
            names.extend(extract_fio(os.path.basename(job.archive_file.name)))

            # Определить самое частое ФИО (если есть)
            patient = None
            if names:
                fio, _ = Counter(names).most_common(1)[0]
                # Пытаемся найти существующего пациента
                patient = Patient.objects.filter(
                    first_name__iexact=fio.split()[1] if len(fio.split())>1 else '',
                    last_name__iexact=fio.split()[0]
                ).first()
                if not patient:
                    # создаём нового пациента
                    parts = fio.split()
                    patient = Patient.objects.create(
                        last_name=parts[0] if len(parts)>0 else '',
                        first_name=parts[1] if len(parts)>1 else '',
                        middle_name=parts[2] if len(parts)>2 else None,
                    )
                job.log += f'Patient: {fio}\n'
            else:
                job.log += 'No FIO found, patient not set\n'

            # Создать запись MedicalRecord
            with transaction.atomic():
                record = MedicalRecord.objects.create(
                    patient=patient,
                    doctor=None,
                    created_by=job.uploaded_by,
                    appointment_location='',
                    notes='',
                    visit_date=None,
                )

                # Для каждого файла — создать LabFile
                for root, _, files in os.walk(tmpdir):
                    for fname in files:
                        path = os.path.join(root, fname)
                        ftype = 'photo' if fname.lower().endswith(('.png', '.jpg', '.jpeg')) else 'ct_scan'
                        with open(path, 'rb') as f:
                            django_file = DjangoFile(f)
                            lab = LabFile.objects.create(
                                record=record,
                                file_type=ftype,
                                uploaded_by=job.uploaded_by,
                            )
                            lab.file.save(fname, django_file, save=True)
                job.log += f'Created record #{record.id} and {len(files)} lab files\n'

        job.status = 'done'
        job.log += 'Processing finished successfully\n'
    except Exception as e:
        job.status = 'failed'
        job.log += f'Error: {str(e)}\n'
        raise
    finally:
        job.save()
