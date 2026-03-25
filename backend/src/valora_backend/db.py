# Engine SQLAlchemy e sessão para a API (fase 1).

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from valora_backend.audit_request import apply_audit_transaction_variables
from valora_backend.config import Settings

_settings = Settings()
engine = create_engine(_settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_session(request: Request) -> Generator[Session, None, None]:
    """Dependency FastAPI: uma sessão por pedido, fechada no fim.

    No PostgreSQL, os gatilhos de auditoria leem `SET LOCAL` da transação.
    O contexto pode ficar completo só depois que outras dependências resolvem
    o membro atual; por isso a sessão reaplica as GUCs ao abrir a transação
    e imediatamente antes de qualquer flush.
    """

    session = SessionLocal()

    def _apply_request_audit_context() -> None:
        apply_audit_transaction_variables(session.connection(), request)

    def _after_begin(_sess: Session, _transaction, connection) -> None:
        apply_audit_transaction_variables(connection, request)

    def _before_flush(_sess: Session, _flush_context, _instances) -> None:
        _apply_request_audit_context()

    event.listen(session, "after_begin", _after_begin)
    event.listen(session, "before_flush", _before_flush)
    try:
        yield session
    finally:
        event.remove(session, "after_begin", _after_begin)
        event.remove(session, "before_flush", _before_flush)
        session.close()


SessionDep = Annotated[Session, Depends(get_session)]
