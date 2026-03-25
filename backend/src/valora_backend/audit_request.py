# Variáveis de transação PostgreSQL para auditoria (lidas pelos triggers em log).

from __future__ import annotations

from fastapi import HTTPException, Request
from sqlalchemy import text
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Session

from valora_backend.auth.jwt import verify_token


def apply_audit_gucs_on_connection(
    connection: Connection,
    tenant_id: int | None,
    account_id: int | None,
) -> None:
    """Define set_config local (equivalente a SET LOCAL) na transação corrente."""
    if connection.dialect.name != "postgresql":
        return
    if tenant_id is not None:
        connection.execute(
            text("SELECT set_config('valora.current_tenant_id', :v, true)"),
            {"v": str(int(tenant_id))},
        )
    if account_id is not None:
        connection.execute(
            text("SELECT set_config('valora.current_account_id', :v, true)"),
            {"v": str(int(account_id))},
        )


def apply_audit_gucs_for_session(
    session: Session,
    tenant_id: int | None,
    account_id: int | None,
) -> None:
    """Atualiza GUCs de auditoria na conexão da sessão (ex.: após carregar Member)."""
    apply_audit_gucs_on_connection(session.connection(), tenant_id, account_id)


def apply_audit_transaction_variables(connection: Connection, request: Request) -> None:
    """Define set_config local na transação a partir do JWT (request.state)."""
    tid = getattr(request.state, "audit_tenant_id", None)
    aid = getattr(request.state, "audit_account_id", None)
    apply_audit_gucs_on_connection(connection, tid, aid)


def try_set_audit_state_from_authorization(request: Request) -> None:
    """Preenche request.state com account_id e tenant_id se o Bearer JWT for válido."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return
    raw = auth.removeprefix("Bearer ").strip()
    if not raw:
        return
    try:
        payload = verify_token(raw)
    except HTTPException:
        return
    sub = payload.get("sub")
    tenant_id_raw = payload.get("tenant_id")
    if sub is None or tenant_id_raw is None:
        return
    try:
        request.state.audit_account_id = int(sub)
        request.state.audit_tenant_id = int(tenant_id_raw)
    except (TypeError, ValueError):
        return
