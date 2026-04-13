# Motor mínimo SimpleEval alinhado à skill rule-formula-simpleeval (lista branca).

from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any

from dateutil.relativedelta import relativedelta
from simpleeval import SimpleEval


def _add_months(d: date | datetime, n: int | float) -> date | datetime:
    months = int(n)
    return d + relativedelta(months=months)


def _add_years(d: date | datetime, n: int | float) -> date | datetime:
    years = int(n)
    return d + relativedelta(years=years)


def build_formula_simple_eval(names: dict[str, Any]) -> SimpleEval:
    """Constrói avaliador com `names` e funções permitidas (sem builtins livres)."""
    evaluator = SimpleEval()
    evaluator.names = names
    evaluator.functions = {
        "date": date,
        "datetime": datetime,
        "timedelta": timedelta,
        "add_months": _add_months,
        "add_years": _add_years,
        "abs": abs,
        "min": min,
        "max": max,
        "round": round,
        "Decimal": Decimal,
    }
    return evaluator
