#!/usr/bin/env python3
import os
import zipfile
import tempfile
from collections import Counter

from utils import decode_filename, extract_fio, extract_dob, extract_phone, extract_email

def process_zip(zip_path: str):
    # 1) старт
    print("Start processing")

    # 2) распаковка с декодом имён
    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            for info in zf.infolist():
                # в точности как в таске:
                try:
                    decoded = decode_filename(info.filename)
                except Exception:
                    decoded = info.filename

                print(f"Имя файла: {decoded}")

                dest = os.path.abspath(os.path.join(tmpdir, decoded))
                if not dest.startswith(os.path.abspath(tmpdir)):
                    continue
                # создаём нужные подпапки
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                zf.extract(info, tmpdir)
                # если zf.extract пишет оригинальное имя — переименуем:
                orig = os.path.join(tmpdir, info.filename)
                if os.path.exists(orig) and orig != dest:
                    os.replace(orig, dest)

        # 3) сбор «сырых» данных
        all_fios, all_dobs, all_phones, all_emails = [], [], [], []
        file_count = 0

        for root, _, files in os.walk(tmpdir):
            for fname in files:
                file_count += 1
                # убираем расширение, чтобы regex не путался
                name_only, _ = os.path.splitext(fname)

                all_fios.extend(extract_fio(name_only))
                all_dobs.extend(extract_dob(name_only))
                all_phones.extend(extract_phone(name_only))
                all_emails.extend(extract_email(name_only))

    # 4) лог извлечения
    print(f"Extracted {len(all_fios)} fio(s), "
          f"{len(all_dobs)} date(s), "
          f"{len(all_phones)} phone(s), "
          f"{len(all_emails)} email(s)")

    # 5) самый частый ФИО
    main = Counter(all_fios).most_common(1)
    if main:
        fio = main[0][0]
        print(f"Patient: {fio}")
    else:
        fio = None
        print("No FIO found; patient not set")

    # 6) эмуляция создания записи
    record_id = 1
    print(f"Created record #{record_id} and {file_count} lab files")

    # 7) завершение
    print("Processing finished successfully")

    # 8) raw_extracted
    raw_extracted = {
        'fios':   all_fios,
        'dobs':   all_dobs,
        'phones': all_phones,
        'emails': all_emails,
    }
    print("\n=== Summary ===")
    print("Raw extracted:", raw_extracted)
    print("Record ID:", record_id)


def main():
    zip_path = "Умаров Арсен Рамазанович.zip"  # <-- ваш путь
    if not os.path.isfile(zip_path):
        print(f"File not found: {zip_path}")
        return
    process_zip(zip_path)


if __name__ == "__main__":
    main()
