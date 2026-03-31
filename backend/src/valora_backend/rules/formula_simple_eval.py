# Motor mínimo SimpleEval alinhado à skill rule-formula-simpleeval (lista branca).

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from simpleeval import SimpleEval


def build_formula_simple_eval(names: dict[str, Any]) -> SimpleEval:
    """Constrói avaliador com `names` e funções permitidas (sem builtins livres)."""
    evaluator = SimpleEval()
    evaluator.names = names
    evaluator.functions = {
        "date": date,
        "abs": abs,
        "min": min,
        "max": max,
        "round": round,
        "Decimal": Decimal,
    }
    return evaluator
