from .settings import *


DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = ['docere.online', 'www.docere.online', 'localhost', '127.0.0.1']


STATIC_ROOT = os.path.join(BASE_DIR, 'static')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Безопасность
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True