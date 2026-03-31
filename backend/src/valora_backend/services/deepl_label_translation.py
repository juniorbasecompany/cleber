"""Cliente DeepL para tradução de textos curtos (rótulos); sem dependência de `api.rules`."""

from __future__ import annotations

from typing import Literal

import requests

# Valores de `label.lang` para field no modelo.
FIELD_LABEL_LANG_LIST: tuple[Literal["pt-BR", "en", "es"], ...] = ("pt-BR", "en", "es")

# Códigos aceitos pela DeepL API v2 (translate).
_APP_LANG_TO_DEEPL: dict[str, str] = {
    "pt-BR": "PT-BR",
    "en": "EN-US",
    "es": "ES",
}

_TRANSLATE_PATH = "/v2/translate"

DEEPL_FREE_API_ORIGIN = "https://api-free.deepl.com"
DEEPL_PRO_API_ORIGIN = "https://api.deepl.com"


def normalize_deepl_api_key(raw: str) -> str:
    """Remove espaços e BOM que às vezes vêm do .env no Windows."""
    return (raw or "").strip().lstrip("\ufeff")


def resolve_deepl_api_base_url(*, configured_url: str, api_key: str | None) -> str:
    """
    A DeepL responde 403 se a chave Free (sufixo :fx) for usada com o host Pro ou o inverso.
    Ajusta o host quando o sufixo da chave indica mismatch com a URL configurada.
    """
    base = normalize_deepl_api_key(configured_url).rstrip("/") or DEEPL_FREE_API_ORIGIN
    key = normalize_deepl_api_key(api_key) if api_key else ""
    if not key:
        return base
    is_free_key = key.endswith(":fx")
    host_is_free = "api-free.deepl.com" in base
    if is_free_key and not host_is_free:
        return DEEPL_FREE_API_ORIGIN
    if not is_free_key and host_is_free:
        return DEEPL_PRO_API_ORIGIN
    return base


def app_lang_to_deepl(lang: str) -> str:
    """Converte `lang` da aplicação para código DeepL."""
    code = _APP_LANG_TO_DEEPL.get(lang)
    if code is None:
        raise ValueError(f"Unsupported app label lang for DeepL: {lang!r}")
    return code


def translate_text_deepl(
    *,
    text: str,
    source_app_lang: str,
    target_app_lang: str,
    api_key: str,
    base_url: str,
    timeout_sec: float = 20.0,
) -> str:
    """
    Traduz um texto curto entre dois idiomas da aplicação.

    Não envia `source_lang`: a DeepL deteta o idioma (`source_lang=PT-BR` devolve 400).
    O parâmetro `source_app_lang` mantém-se para não quebrar chamadas.
    """
    _ = source_app_lang
    url = base_url.rstrip("/") + _TRANSLATE_PATH
    target = app_lang_to_deepl(target_app_lang)
    # DeepL obsoletou auth_key no body/query (403 após jan/2026); usar header oficial.
    resp = requests.post(
        url,
        data={
            "text": text,
            "target_lang": target,
        },
        headers={
            "Authorization": f"DeepL-Auth-Key {api_key}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout=timeout_sec,
    )
    resp.raise_for_status()
    data = resp.json()
    translations = data.get("translations")
    if not translations or not isinstance(translations, list):
        raise ValueError("DeepL response missing translations")
    first = translations[0]
    if not isinstance(first, dict) or "text" not in first:
        raise ValueError("DeepL response missing translation text")
    out = first["text"]
    if not isinstance(out, str):
        raise ValueError("DeepL translation text is not a string")
    return out.strip()