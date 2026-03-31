"""Cliente DeepL para tradução de textos curtos (rótulos); sem dependência de `api.rules`."""

from __future__ import annotations

from typing import Literal

import requests

# Valores de `label.lang` para field no modelo.
FIELD_LABEL_LANG_LIST: tuple[Literal["pt-BR", "en", "es"], ...] = ("pt-BR", "en", "es")

# Códigos `target_lang` na API (variantes regionais quando existirem).
_APP_LANG_TO_DEEPL_TARGET: dict[str, str] = {
    "pt-BR": "PT-BR",
    "en": "EN-US",
    "es": "ES",
}

# Códigos `source_lang`: a API aceita agregados (PT, EN), não PT-BR nem EN-US.
_APP_LANG_TO_DEEPL_SOURCE: dict[str, str] = {
    "pt-BR": "PT",
    "en": "EN",
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
    """Converte `lang` da aplicação para código DeepL em `target_lang`."""
    code = _APP_LANG_TO_DEEPL_TARGET.get(lang)
    if code is None:
        raise ValueError(f"Unsupported app label lang for DeepL: {lang!r}")
    return code


def app_lang_to_deepl_source(lang: str) -> str:
    """Converte `lang` da aplicação para código DeepL em `source_lang`."""
    code = _APP_LANG_TO_DEEPL_SOURCE.get(lang)
    if code is None:
        raise ValueError(f"Unsupported app label lang for DeepL source: {lang!r}")
    return code


def translate_text_deepl(
    *,
    text: str,
    source_app_lang: str,
    target_app_lang: str,
    api_key: str,
    base_url: str,
    timeout_sec: float = 20.0,
) -> tuple[str, str | None]:
    """
    Traduz um texto curto do idioma de origem para o de destino da aplicação.

    Envia `source_lang` e `target_lang` (mapeamentos distintos: origem PT/EN/ES,
    destino PT-BR/EN-US/ES). Para rótulos curtos usa `split_sentences=0`.
    Retorna (texto traduzido, detected_source_language ou None).
    """
    url = base_url.rstrip("/") + _TRANSLATE_PATH
    source = app_lang_to_deepl_source(source_app_lang)
    target = app_lang_to_deepl(target_app_lang)
    # DeepL obsoletou auth_key no body/query (403 após jan/2026); usar header oficial.
    resp = requests.post(
        url,
        data={
            "text": text,
            "source_lang": source,
            "target_lang": target,
            "split_sentences": "0",
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
    raw_detected = first.get("detected_source_language")
    detected: str | None
    if raw_detected is None:
        detected = None
    elif isinstance(raw_detected, str):
        detected = raw_detected
    else:
        detected = str(raw_detected)
    return out.strip(), detected
