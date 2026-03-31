"""Testes do cliente DeepL para rótulos."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
import requests
from sqlalchemy import select

from valora_backend.model.identity import Scope
from valora_backend.model.rules import Field, Label
from valora_backend.services.deepl_label_translation import (
    app_lang_to_deepl,
    resolve_deepl_api_base_url,
    translate_text_deepl,
)

from test_member_directory_api import build_test_client


def test_resolve_deepl_api_base_url_free_key_on_pro_host() -> None:
    assert (
        resolve_deepl_api_base_url(
            configured_url="https://api.deepl.com",
            api_key="abc:fx",
        )
        == "https://api-free.deepl.com"
    )


def test_resolve_deepl_api_base_url_pro_key_on_free_host() -> None:
    assert (
        resolve_deepl_api_base_url(
            configured_url="https://api-free.deepl.com",
            api_key="279a2e9d-83b3-c416-7e2d-f721593e42a0",
        )
        == "https://api.deepl.com"
    )


def test_resolve_deepl_api_base_url_free_key_matching_host_unchanged() -> None:
    assert (
        resolve_deepl_api_base_url(
            configured_url="https://api-free.deepl.com",
            api_key="x:fx",
        )
        == "https://api-free.deepl.com"
    )


def test_app_lang_to_deepl_maps() -> None:
    assert app_lang_to_deepl("pt-BR") == "PT-BR"
    assert app_lang_to_deepl("en") == "EN-US"
    assert app_lang_to_deepl("es") == "ES"


def test_app_lang_to_deepl_unknown() -> None:
    with pytest.raises(ValueError, match="Unsupported"):
        app_lang_to_deepl("fr")


@patch("valora_backend.services.deepl_label_translation.requests.post")
def test_translate_text_deepl_success(mock_post: MagicMock) -> None:
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {"translations": [{"text": "  Hello  "}]}
    mock_post.return_value = mock_resp

    out = translate_text_deepl(
        text="Oi",
        source_app_lang="pt-BR",
        target_app_lang="en",
        api_key="k",
        base_url="https://api-free.deepl.com",
    )
    assert out == "Hello"

    mock_post.assert_called_once()
    call_kw = mock_post.call_args
    assert call_kw[0][0] == "https://api-free.deepl.com/v2/translate"
    data = call_kw[1]["data"]
    assert "auth_key" not in data
    assert data["text"] == "Oi"
    assert "source_lang" not in data
    assert data["target_lang"] == "EN-US"
    hdr = call_kw[1]["headers"]
    assert hdr["Authorization"] == "DeepL-Auth-Key k"


def test_create_field_label_triggers_deepl_with_auth_header(monkeypatch: pytest.MonkeyPatch) -> None:
    """Fluxo HTTP: POST field com label chama DeepL com Authorization (não auth_key no body)."""
    calls: list[dict] = []

    def fake_post(url: str, data=None, headers=None, timeout=None, **_k: object) -> MagicMock:
        calls.append({"url": url, "data": dict(data or {}), "headers": dict(headers or {})})
        target = (data or {}).get("target_lang", "")
        out = {
            "EN-US": "Number of items",
            "ES": "Número de artículos",
        }.get(target, "x")
        m = MagicMock()
        m.raise_for_status = MagicMock()
        m.json.return_value = {"translations": [{"text": out}]}
        return m

    # Sufixo :fx = chave Free; assim resolve_deepl_api_base_url mantém api-free (como o fake_post).
    monkeypatch.setenv("DEEPL_API_KEY", "test-deepl-secret:fx")

    with patch(
        "valora_backend.services.deepl_label_translation.requests.post",
        side_effect=fake_post,
    ):
        with build_test_client(current_member_key="admin") as (client, session, _):
            scope_id = session.scalar(select(Scope.id).where(Scope.name == "Aves"))
            assert scope_id is not None
            r = client.post(
                f"/auth/tenant/current/scopes/{scope_id}/fields",
                json={
                    "sql_type": "INTEGER",
                    "label_lang": "pt-BR",
                    "label_name": "Número de itens",
                },
            )
            assert r.status_code == 200, r.text
            field_id = session.scalar(select(Field.id).where(Field.scope_id == scope_id))
            assert field_id is not None
            rows = session.execute(
                select(Label.lang, Label.name).where(Label.field_id == field_id)
            ).all()
            by_lang = {lang: name for lang, name in rows}
            assert by_lang.get("pt-BR") == "Número de itens"
            assert by_lang.get("en") == "Number of items"
            assert by_lang.get("es") == "Número de artículos"
    assert len(calls) == 2
    for c in calls:
        assert "auth_key" not in c["data"]
        assert c["headers"].get("Authorization") == "DeepL-Auth-Key test-deepl-secret:fx"


@patch("valora_backend.services.deepl_label_translation.requests.post")
def test_translate_text_deepl_http_error(mock_post: MagicMock) -> None:
    mock_post.side_effect = requests.HTTPError("fail")
    with pytest.raises(requests.HTTPError):
        translate_text_deepl(
            text="x",
            source_app_lang="en",
            target_app_lang="es",
            api_key="k",
            base_url="https://x",
        )