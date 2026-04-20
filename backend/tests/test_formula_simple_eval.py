from __future__ import annotations

from valora_backend.rules.formula_simple_eval import build_formula_simple_eval


def test_coalesce_returns_first_when_not_none() -> None:
    evaluator = build_formula_simple_eval({"a": 3, "b": 5})
    assert evaluator.eval("coalesce(a, b)") == 3


def test_coalesce_returns_second_when_first_is_none() -> None:
    evaluator = build_formula_simple_eval({"a": None, "b": 5})
    assert evaluator.eval("coalesce(a, b)") == 5


def test_coalesce_returns_none_when_both_are_none() -> None:
    evaluator = build_formula_simple_eval({"a": None, "b": None})
    assert evaluator.eval("coalesce(a, b)") is None
