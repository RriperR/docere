from django.apps import AppConfig


class MainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'main'

    def ready(self) -> None:
        # импорт чтобы зарегистрировать receivers
        from . import signals  # noqa: F401
