"""Cópias do e-mail de convite de membro, alinhadas semanticamente a messages/* por locale."""

from __future__ import annotations

import json
from functools import lru_cache
from importlib import resources
from typing import Any


def resolve_member_invite_locale(raw: str | None) -> str:
    cleaned = (raw or "").strip().replace("_", "-")
    if cleaned in _supported_locale_set():
        return cleaned
    if cleaned.lower() == "pt-br":
        return "pt-BR"
    if cleaned.lower() == "es-es":
        return "es-ES"
    if cleaned.lower() == "en-us":
        return "en-US"
    return "en-US"


@lru_cache
def _supported_locale_set() -> frozenset[str]:
    return frozenset(_load_raw_copy().keys())


@lru_cache
def _load_raw_copy() -> dict[str, dict[str, str]]:
    text = resources.files("valora_backend.locale").joinpath("member_invite_email.json").read_text(
        encoding="utf-8"
    )
    data: dict[str, Any] = json.loads(text)
    return {key: dict(value) for key, value in data.items()}


def get_member_invite_email_strings(locale: str) -> dict[str, str]:
    resolved = resolve_member_invite_locale(locale)
    table = _load_raw_copy()
    return dict(table.get(resolved) or table["en-US"])
