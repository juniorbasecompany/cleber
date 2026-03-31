"""
Testa POST /v2/translate (via cliente do projeto) com origem e destino explícitos.

Percorre todos os pares (idioma app origem × idioma app destino) em pt-BR, en, es.
Palavra fixa "data" para inspecionar data (calendário) vs dados (informação).

Uso (pasta backend, `.env` na raiz do repositório):
  .\\.venv\\Scripts\\python.exe script_test_deepl_source_lang.py
"""
from __future__ import annotations

import sys
from itertools import product

import requests

from valora_backend.config import Settings
from valora_backend.services.deepl_label_translation import (
    app_lang_to_deepl,
    app_lang_to_deepl_source,
    normalize_deepl_api_key,
    resolve_deepl_api_base_url,
    translate_text_deepl,
)

WORD = "data"

# Idiomas da app alinhados a FIELD_LABEL_LANG_LIST
APP_LANG_LIST: tuple[str, ...] = ("pt-BR", "en", "es")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except (OSError, ValueError):
            pass

    settings = Settings()
    secret = settings.deepl_api_key
    if secret is None:
        print("ERRO: DEEPL_API_KEY não está definida (.env na raiz).")
        return 1
    key = normalize_deepl_api_key(secret.get_secret_value())
    if not key:
        print("ERRO: DEEPL_API_KEY está vazia.")
        return 1

    base = resolve_deepl_api_base_url(
        configured_url=settings.deepl_api_base_url,
        api_key=key,
    ).rstrip("/")
    preview = f"{key[:8]}…{key[-6:]}" if len(key) > 14 else "(chave curta)"
    tipo = "Free (:fx)" if key.endswith(":fx") else "Pro (sem :fx)"
    print(f"Chave: {preview} | {tipo} | Host: {base}")
    print(f"Palavra fixa: {WORD!r}")
    print()
    print(
        f"{'origem':<8} {'destino':<8} {'src API':<8} {'tgt API':<8} "
        f"{'tradução':<22} {'detetado':<10} nota"
    )
    print("-" * 100)

    exit_code = 0
    for src_app, tgt_app in product(APP_LANG_LIST, APP_LANG_LIST):
        src_code = app_lang_to_deepl_source(src_app)
        tgt_code = app_lang_to_deepl(tgt_app)
        note = ""
        if src_app == tgt_app:
            note = "(mesmo par app; DeepL pode devolver igual ou normalizar)"
        try:
            translated, detected = translate_text_deepl(
                text=WORD,
                source_app_lang=src_app,
                target_app_lang=tgt_app,
                api_key=key,
                base_url=base,
            )
            det = detected or "-"
            coerencia = ""
            if src_app == "pt-BR" and tgt_app == "es":
                coerencia = "esperado ~ fecha/data (calendário)" if "fecha" in translated.lower() else ""
            elif src_app == "en" and tgt_app == "es":
                coerencia = "esperado ~ datos (informação)" if "datos" in translated.lower() else ""
            if coerencia:
                note = f"{note} {coerencia}".strip()
            print(
                f"{src_app:<8} {tgt_app:<8} {src_code:<8} {tgt_code:<8} "
                f"{translated!s:<22} {det!s:<10} {note}".rstrip()
            )
        except requests.HTTPError as exc:
            exit_code = 1
            extra = ""
            if exc.response is not None:
                extra = f" body={exc.response.text[:200]!r}"
            print(
                f"{src_app:<8} {tgt_app:<8} {src_code:<8} {tgt_code:<8} "
                f"{'ERRO HTTP':<22} {'-':<10} {exc!s}{extra}"
            )
        except Exception as exc:  # noqa: BLE001 — script de diagnóstico
            exit_code = 1
            print(
                f"{src_app:<8} {tgt_app:<8} {src_code:<8} {tgt_code:<8} "
                f"{'ERRO':<22} {'-':<10} {type(exc).__name__}: {exc}"
            )

    print()
    if exit_code == 0:
        print("OK: todas as chamadas concluíram.")
    else:
        print("Houve falhas; ver linhas ERRO acima.")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
