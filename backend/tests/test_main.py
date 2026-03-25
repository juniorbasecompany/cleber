from __future__ import annotations

import json

from sqlalchemy.exc import DBAPIError, IntegrityError

from valora_backend.main import try_build_audit_db_error_response


def test_try_build_audit_db_error_response_maps_known_audit_error() -> None:
    response = try_build_audit_db_error_response(
        IntegrityError(
            "INSERT INTO scope ...",
            {},
            Exception("Audit context missing tenant_id for table scope, action INSERT"),
        )
    )

    assert response is not None
    assert response.status_code == 409
    assert json.loads(response.body) == {
        "detail": (
            "Operacao bloqueada pela auditoria: a sessao atual nao informou "
            "o licenciado responsavel. Atualize a pagina e tente novamente."
        )
    }


def test_try_build_audit_db_error_response_ignores_unrelated_db_errors() -> None:
    response = try_build_audit_db_error_response(
        DBAPIError(
            "INSERT INTO scope ...",
            {},
            Exception("duplicate key value violates unique constraint"),
        )
    )

    assert response is None
