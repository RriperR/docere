import logging

from django.db.models.signals import post_save
from django.db import transaction
from django.dispatch import receiver
from django.utils import timezone

from .models import User
from integrations.eventhub.client import EventDTO, publish_event_safe

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def user_registered(sender, instance: User, created: bool, raw: bool = False, **kwargs):
    """
    Публикуем событие в EventHub при регистрации пользователя (created=True).
    - raw=True (например, loaddata) игнорируем
    - публикуем ПОСЛЕ коммита, чтобы не ловить гонки/откаты
    - ошибки публикации не пробрасываем
    """
    print("signal fired")
    if raw or not created:
        return

    # Кто «действовал» — сам зарегистрированный пользователь
    actor_id = str(instance.id) if instance.id is not None else None

    # Тенант — подставь свою логику. Пока считаем, что один тенант = id пользователя,
    # либо «нулевой» если по бизнес-логике требуется.
    tenant_id = actor_id or "00000000-0000-0000-0000-000000000000"

    # Если у пользователя уже создан профиль пациента — прокинем patient_id
    patient_id = None
    try:
        if hasattr(instance, "patient_profile") and instance.patient_profile:
            patient_id = str(instance.patient_profile.id)
    except Exception:
        # На момент создания user профиль может ещё не быть создан — это ок
        pass

    event = EventDTO(
        id=str(instance.id),                 # можно использовать id пользователя как id события
        tenant_id=tenant_id,
        type="user.registered",
        actor_id=actor_id,
        patient_id=patient_id,
        ts=timezone.now(),
        props={
            "email": instance.email,
            "phone": instance.phone,
            "role": instance.role,
            "username": instance.username,
            "full_name": instance.get_full_name(),
        },
    )

    # Публикуем только после успешного коммита транзакции создания пользователя
    def _publish():
        ok = publish_event_safe(event)
        if not ok:
            logger.warning("User registration event not published (EventHub down?) user_id=%s", instance.id)

    try:
        transaction.on_commit(_publish)
    except Exception as exc:
        # не ломаем основной флоу
        logger.warning("user_registered handler failed: %s", exc)
