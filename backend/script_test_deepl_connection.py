"""
Testa comunicação real com a DeepL e uma tradução pt-BR → en (e opcionalmente es).

Uso (na pasta backend, com `.env` na raiz do repositório como o resto do projeto):
  .\\.venv\\Scripts\\python.exe script_test_deepl_connection.py

Não imprime a chave completa (apenas indica se termina em :fx e o host usado).
"""
from __future__ import annotations

import sys

from valora_backend.config import Settings
from valora_backend.services.deepl_label_translation import (
    normalize_deepl_api_key,
    resolve_deepl_api_base_url,
    translate_text_deepl,
)


def main() -> int:
    settings = Settings()
    secret = settings.deepl_api_key
    if secret is None:
        print("ERRO: DEEPL_API_KEY não está definida no ambiente (.env na raiz).")
        return 1
    key = normalize_deepl_api_key(secret.get_secret_value())
    if not key:
        print("ERRO: DEEPL_API_KEY está vazia.")
        return 1

    base = resolve_deepl_api_base_url(
        configured_url=settings.deepl_api_base_url,
        api_key=key,
    )
    preview = f"{key[:8]}…{key[-6:]}" if len(key) > 14 else "(chave curta)"
    tipo = "Free (:fx)" if key.endswith(":fx") else "Pro (sem :fx)"
    print(f"Chave: {preview} | tipo: {tipo}")
    print(f"Host: {base}")
    print()

    texto = "Número de itens no lote"
    try:
        en, _ = translate_text_deepl(
            text=texto,
            source_app_lang="pt-BR",
            target_app_lang="en",
            api_key=key,
            base_url=base,
        )
        print("pt-BR:", texto)
        print("en:   ", en)
        es, _ = translate_text_deepl(
            text=texto,
            source_app_lang="pt-BR",
            target_app_lang="es",
            api_key=key,
            base_url=base,
        )
        print("es:   ", es)
    except Exception as exc:  # noqa: BLE001 — script de diagnóstico
        print("FALHA:", type(exc).__name__, exc)
        if hasattr(exc, "response") and exc.response is not None:
            print("HTTP:", exc.response.status_code, exc.response.text[:500])
        return 1

    print()
    print("OK: tradução concluída.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
