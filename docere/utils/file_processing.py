from PIL import Image
import os
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

def is_image(file):
    try:
        Image.open(file).verify()
        return True
    except Exception:
        return False

def generate_thumbnail_base64(image_file, size=(100, 100)):
    """
    Генерирует миниатюру изображения и возвращает её в формате Base64.
    """
    try:
        image = Image.open(image_file)
        image.thumbnail(size, Image.Resampling.LANCZOS)

        # Сохраняем изображение в BytesIO
        thumb_io = BytesIO()
        image.save(thumb_io, format=image.format)
        thumb_io.seek(0)

        # Конвертируем в Base64
        base64_thumb = base64.b64encode(thumb_io.read()).decode('utf-8')
        return f"data:image/{image.format.lower()};base64,{base64_thumb}"
    except Exception as e:
        print(f"Ошибка при создании миниатюры: {e}")
        return None
