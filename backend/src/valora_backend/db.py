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

    No PostgreSQL, após o início da transação, aplica set_config local
    (equivalente a SET LOCAL) para os triggers de auditoria em log.
    """
    session = SessionLocal()

    def _after_begin(_sess: Session, _transaction, connection) -> None:
        apply_audit_transaction_variables(connection, request)

    event.listen(session, "after_begin", _after_begin)
    try:
        yield session
    finally:
        event.remove(session, "after_begin", _after_begin)
        session.close()


SessionDep = Annotated[Session, Depends(get_session)]
