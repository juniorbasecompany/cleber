# Testes de triggers de auditoria (PostgreSQL com schema migrado).

from __future__ import annotations

import os
import uuid

import pytest
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session, sessionmaker

from valora_backend.audit_request import apply_audit_gucs_for_session
from valora_backend.config import Settings
from valora_backend.model.identity import Account, Scope, Tenant
from valora_backend.model.log import Log

pytestmark = pytest.mark.skipif(
    os.environ.get("VALORA_AUDIT_PG_TEST") != "1",
    reason="Defina VALORA_AUDIT_PG_TEST=1 e Postgres migrado (alembic upgrade head).",
)


@pytest.fixture
def pg_session() -> Session:
    settings = Settings()
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    if engine.dialect.name != "postgresql":
        pytest.skip("URL de banco não é PostgreSQL")
    SessionPG = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionPG()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_audit_log_after_insert_scope_with_set_config(pg_session: Session) -> None:
    suffix = uuid.uuid4().hex[:12]
    account = Account(
        name="Audit Actor",
        display_name="Audit Actor",
        email=f"audit-scope-insert-{suffix}@example.com",
        provider="test",
        provider_subject=f"audit-scope-insert-{suffix}",
    )
    pg_session.add(account)
    tenant = Tenant(
        name=f"Audit Tenant Co {suffix}",
        display_name="Audit Tenant",
    )
    pg_session.add(tenant)
    pg_session.flush()
    apply_audit_gucs_for_session(pg_session, tenant.id, account.id)
    before = pg_session.scalar(select(Log.id).order_by(Log.id.desc()).limit(1))

    scope = Scope(
        name="s1",
        display_name="Scope audit",
        tenant_id=tenant.id,
    )
    pg_session.add(scope)
    pg_session.commit()

    row = pg_session.scalar(
        select(Log)
        .where(Log.table_name == "scope", Log.action_type == "I")
        .order_by(Log.id.desc())
        .limit(1)
    )
    assert row is not None
    assert row.tenant_id == tenant.id
    assert row.account_id == account.id
    assert row.row_payload is not None
    assert row.row_payload.get("name") == "s1"
    if before is not None:
        assert row.id > before

    pg_session.execute(text("DELETE FROM log WHERE id = :id"), {"id": row.id})
    pg_session.execute(text("DELETE FROM scope WHERE id = :id"), {"id": scope.id})
    pg_session.execute(text("DELETE FROM tenant WHERE id = :id"), {"id": tenant.id})
    pg_session.execute(text("DELETE FROM account WHERE id = :id"), {"id": account.id})
    pg_session.commit()


def test_audit_log_delete_has_null_row(pg_session: Session) -> None:
    suffix = uuid.uuid4().hex[:12]
    account = Account(
        name="Audit Actor Del",
        display_name="Audit Actor Del",
        email=f"audit-scope-del-{suffix}@example.com",
        provider="test",
        provider_subject=f"audit-scope-del-{suffix}",
    )
    pg_session.add(account)
    tenant = Tenant(name=f"Audit Tenant Del {suffix}", display_name="Audit Del")
    pg_session.add(tenant)
    pg_session.flush()
    apply_audit_gucs_for_session(pg_session, tenant.id, account.id)
    scope = Scope(name="to-del", display_name="del", tenant_id=tenant.id)
    pg_session.add(scope)
    pg_session.flush()
    scope_id = scope.id
    pg_session.commit()

    apply_audit_gucs_for_session(pg_session, tenant.id, account.id)
    scope_del = pg_session.get(Scope, scope_id)
    assert scope_del is not None
    pg_session.delete(scope_del)
    pg_session.commit()

    row = pg_session.scalar(
        select(Log)
        .where(Log.table_name == "scope", Log.action_type == "D")
        .order_by(Log.id.desc())
        .limit(1)
    )
    assert row is not None
    assert row.row_payload is None
    assert row.tenant_id == tenant.id
    assert row.account_id == account.id
    # Remove registos de auditoria deste tenant e entidades de teste
    pg_session.execute(
        text("DELETE FROM log WHERE tenant_id = :tid"), {"tid": tenant.id}
    )
    pg_session.execute(text("DELETE FROM tenant WHERE id = :id"), {"id": tenant.id})
    pg_session.execute(text("DELETE FROM account WHERE id = :id"), {"id": account.id})
    pg_session.commit()
