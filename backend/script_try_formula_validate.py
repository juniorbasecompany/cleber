# Simula validate_formula_statement_for_scope (dry-run igual ao gravar).
# Uso a partir da pasta backend com PYTHONPATH=src:
#   python script_try_formula_validate.py 1,2 "${field:1} = ${field:1} * 2" "${field:2} = ${field:1} + 0.20"
# Primeiro argumento: IDs de campo que existem no escopo (CSV). Demais: uma instrução por argumento.

from __future__ import annotations

import sys
from unittest.mock import MagicMock

from valora_backend.rules.formula_statement_validate import (
    FormulaStatementValidationError,
    validate_formula_statement_for_scope,
)


def main() -> None:
    if len(sys.argv) < 3:
        print(
            "Uso: PYTHONPATH=src python script_try_formula_validate.py <ids_csv> <statement> [statement ...]\n"
            "  ids_csv : IDs de campo no escopo, ex: 1,2\n"
            "  cada statement: texto persistido com ${field:n} (não o nome amigável do editor)."
        )
        sys.exit(1)

    id_list = [int(x.strip()) for x in sys.argv[1].split(",") if x.strip()]
    session = MagicMock()
    chain = MagicMock()
    chain.all.return_value = id_list
    session.scalars.return_value = chain

    for idx, stmt in enumerate(sys.argv[2:], start=1):
        print(f"--- Ordem {idx} (step {idx}) ---")
        print(repr(stmt))
        try:
            validate_formula_statement_for_scope(
                session, scope_id=1, statement=stmt
            )
            print("OK\n")
        except FormulaStatementValidationError as exc:
            print(f"FALHA code={exc.code}\n        msg={exc.message}\n")


if __name__ == "__main__":
    main()
