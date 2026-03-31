"""
Altera o rótulo de um field via API REST (PATCH), como o frontend.

Uso (backend na porta 8003, Postgres local alinhado ao .env da raiz):
  uv run python script_patch_field_label_via_api.py
  uv run python script_patch_field_label_via_api.py http://127.0.0.1:8003 1

O JWT é emitido com APP_JWT_SECRET para um member admin/master do mesmo tenant do field.
"""
from __future__ import annotations

import sys

import requests
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from valora_backend.auth.jwt import create_access_token
from valora_backend.config import Settings
from valora_backend.model.identity import Member, Scope
from valora_backend.model.rules import Field


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8003"
    field_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    new_label = (
        sys.argv[3] if len(sys.argv) > 3 else "Número de itens"
    )

    settings = Settings()
    engine = create_engine(settings.database_url)
    session_local = sessionmaker(bind=engine)

    with session_local() as session:
        field = session.get(Field, field_id)
        if field is None:
            print(f"field id={field_id} não encontrado")
            return 1
        scope = session.get(Scope, field.scope_id)
        if scope is None:
            print("scope do field não encontrado")
            return 1
        member = session.scalar(
            select(Member).where(
                Member.tenant_id == scope.tenant_id,
                Member.status == 1,
                Member.role.in_((1, 2)),
            ).limit(1)
        )
        if member is None:
            print("nenhum member master/admin ativo nesse tenant")
            return 1
        token = create_access_token(
            account_id=member.account_id,
            tenant_id=member.tenant_id,
        )
        scope_id = field.scope_id

    url = (
        f"{base.rstrip('/')}/auth/tenant/current/scopes/{scope_id}"
        f"/fields/{field_id}"
    )
    response = requests.patch(
        url,
        json={"label_lang": "pt-BR", "label_name": new_label},
        headers={"Authorization": f"Bearer {token}"},
        timeout=120,
    )
    print(response.status_code)
    if response.text:
        print(response.text[:2000])
    return 0 if response.status_code == 200 else 1


if __name__ == "__main__":
    raise SystemExit(main())
