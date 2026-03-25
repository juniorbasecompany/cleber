"""Variáveis de transação PostgreSQL usadas pelos gatilhos de auditoria."""

from __future__ import annotations

from fastapi import HTTPException, Request
from sqlalchemy import text
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Session

from valora_backend.auth.jwt import verify_token


def _serialize_audit_guc_value(value: int | None) -> str:
    """Converte ids de auditoria para o formato aceito por `set_config`.

    String vazia limpa um `SET LOCAL` anterior na mesma transacao.
    """
    if value is None:
        return ""
    return str(int(value))


def apply_audit_gucs_on_connection(
    connection: Connection,
    tenant_id: int | None,
    account_id: int | None,
) -> None:
    """Define GUCs locais da transação na conexão PostgreSQL corrente."""
    if connection.dialect.name != "postgresql":
        return
    connection.execute(
        text("SELECT set_config('valora.current_tenant_id', :v, true)"),
        {"v": _serialize_audit_guc_value(tenant_id)},
    )
    connection.execute(
        text("SELECT set_config('valora.current_account_id', :v, true)"),
        {"v": _serialize_audit_guc_value(account_id)},
    )


def apply_audit_gucs_for_session(
    session: Session,
    tenant_id: int | None,
    account_id: int | None,
) -> None:
    """Atualiza as GUCs de auditoria na conexão ativa da sessão SQLAlchemy."""
    apply_audit_gucs_on_connection(session.connection(), tenant_id, account_id)


def set_request_audit_state(
    request: Request,
    *,
    tenant_id: int | None,
    account_id: int | None,
) -> None:
    """Persiste os identificadores de auditoria em `request.state`."""
    request.state.audit_tenant_id = tenant_id
    request.state.audit_account_id = account_id


def apply_audit_transaction_variables(connection: Connection, request: Request) -> None:
    """Aplica as GUCs de auditoria a partir de `request.state` ao iniciar a transação."""
    tenant_id = getattr(request.state, "audit_tenant_id", None)
    account_id = getattr(request.state, "audit_account_id", None)
    apply_audit_gucs_on_connection(connection, tenant_id, account_id)


def try_set_audit_state_from_authorization(request: Request) -> None:
    """Preenche `request.state` com ids de auditoria quando houver Bearer JWT válido."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return
    raw_token = auth.removeprefix("Bearer ").strip()
    if not raw_token:
        return
    try:
        payload = verify_token(raw_token)
    except HTTPException:
        return

    account_id_raw = payload.get("sub")
    tenant_id_raw = payload.get("tenant_id")
    if account_id_raw is None or tenant_id_raw is None:
        return
    try:
        set_request_audit_state(
            request,
            tenant_id=int(tenant_id_raw),
            account_id=int(account_id_raw),
        )
    except (TypeError, ValueError):
        return
