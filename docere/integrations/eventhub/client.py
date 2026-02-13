import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Mapping, Any

import grpc
from django.conf import settings
from google.protobuf.struct_pb2 import Struct
from google.protobuf.timestamp_pb2 import Timestamp

from eventhub.v1 import events_pb2, events_pb2_grpc


logger = logging.getLogger(__name__)


@dataclass(slots=True)
class EventDTO:
    id: str
    tenant_id: str
    type: str
    actor_id: str | None
    patient_id: str | None
    ts: datetime
    props: Mapping[str, Any] | None = None


def _to_pb_event(e: EventDTO) -> events_pb2.Event:
    ts = Timestamp()
    aware = e.ts if e.ts.tzinfo else e.ts.replace(tzinfo=timezone.utc)
    ts.FromDatetime(aware.astimezone(timezone.utc))

    s = Struct()
    if e.props:
        s.update(dict(e.props))

    return events_pb2.Event(
        id=e.id,
        tenant_id=e.tenant_id,
        type=e.type,
        actor_id=e.actor_id or "",
        patient_id=e.patient_id or "",
        ts=ts,
        props=s,
    )


def publish_event(e: EventDTO) -> bool:
    """Синхронный вызов. Для нагруженных путей лучше через Celery задачу."""
    if not getattr(settings, "EVENTHUB_ENABLED", True):
        return False

    addr = getattr(settings, "EVENTHUB_GRPC_ADDR", "127.0.0.1:50051")
    timeout = float(getattr(settings, "EVENTHUB_TIMEOUT_SEC", 3.0))

    logger.info("EventHub: sending to %s", addr)
    with grpc.insecure_channel(addr) as channel:
        stub = events_pb2_grpc.EventIngestStub(channel)
        req = events_pb2.PublishEventRequest(event=_to_pb_event(e))
        resp = stub.PublishEvent(req, timeout=timeout)
        return bool(resp.ok)


# безопасная обёртка — не кидает исключений наружу
def publish_event_safe(e: EventDTO) -> bool:
    try:
        return publish_event(e)
    except grpc.RpcError as exc:
        # EventHub недоступен/таймаут и т.п. — просто предупреждаем и идём дальше
        logger.warning("EventHub gRPC publish failed: %s", exc)
        return False
    except Exception as exc:  # на всякий
        logger.warning("EventHub publish unexpected error: %s", exc)
        return False
