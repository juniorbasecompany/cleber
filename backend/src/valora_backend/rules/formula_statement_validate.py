# Validação da instrução de fórmula ao gravar: atribuição LHS + expressão SimpleEval na RHS.

from __future__ import annotations

import logging
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from valora_backend.model.rules import Field
from valora_backend.rules.formula_simple_eval import build_formula_simple_eval

logger = logging.getLogger(__name__)

# Referência a campo no texto persistido (ex.: ${field:1}).
FIELD_REF_PATTERN = re.compile(r"\$\{field:(\d+)\}")
# Lado esquerdo deve ser exclusivamente um token de campo.
TARGET_LHS_PATTERN = re.compile(r"^\$\{field:(\d+)\}$")


class FormulaStatementValidationError(Exception):
    """Erro de validação com código estável para a API (`code`) e mensagem humana (`message`)."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def _python_name_for_field(field_id: int) -> str:
    return f"f_{field_id}"


def _replace_field_tokens_with_eval_names(rhs: str) -> str:
    """Substitui ${field:n} por identificador Python seguro f_n."""

    return FIELD_REF_PATTERN.sub(
        lambda m: _python_name_for_field(int(m.group(1))), rhs
    )


def validate_formula_statement_for_scope(
    session: Session,
    *,
    scope_id: int,
    statement: str,
) -> None:
    """
    Garante:
    - formato `alvo = expressão` (primeiro `=` como separador);
    - alvo exatamente `${field:id}`;
    - todos os ids referenciados existem no escopo;
    - RHS avaliável por SimpleEval com valores stub (dry-run).
    """
    text = statement.strip()
    if not text:
        raise FormulaStatementValidationError(
            "formula_invalid_assignment",
            "Expected assignment: target = expression.",
        )

    eq_index = text.find("=")
    if eq_index < 0:
        raise FormulaStatementValidationError(
            "formula_invalid_assignment",
            "Expected assignment: target = expression.",
        )

    lhs = text[:eq_index].strip()
    rhs = text[eq_index + 1 :].strip()
    if not lhs or not rhs:
        raise FormulaStatementValidationError(
            "formula_invalid_assignment",
            "Left and right sides of assignment must not be empty.",
        )

    target_match = TARGET_LHS_PATTERN.match(lhs)
    if not target_match:
        raise FormulaStatementValidationError(
            "formula_invalid_target",
            "Left side must be exactly one field reference: ${field:<id>}.",
        )
    target_id = int(target_match.group(1))

    ids_in_rhs = {int(x) for x in FIELD_REF_PATTERN.findall(rhs)}
    all_referenced = {target_id} | ids_in_rhs

    scope_field_ids = set(
        session.scalars(select(Field.id).where(Field.scope_id == scope_id)).all()
    )
    unknown = all_referenced - scope_field_ids
    if unknown:
        raise FormulaStatementValidationError(
            "formula_unknown_field_id",
            "One or more field references are not in this scope.",
        )

    transformed_rhs = _replace_field_tokens_with_eval_names(rhs)
    # Só são necessários nomes para campos que aparecem na RHS (${field:…}).
    # Usar int 0: com Decimal("0") o dry-run falha em expressões com literais float
    # (ex.: f_1 + 0.20) porque Python não soma Decimal + float.
    stub_names = dict.fromkeys(
        (_python_name_for_field(fid) for fid in ids_in_rhs), 0
    )

    try:
        evaluator = build_formula_simple_eval(stub_names)
        evaluator.eval(transformed_rhs)
    except Exception as exc:  # noqa: BLE001 — dry-run: mapear qualquer falha para código estável
        logger.debug("Formula expression dry-run failed: %s", exc, exc_info=True)
        raise FormulaStatementValidationError(
            "formula_expression_invalid",
            "The calculation expression could not be validated.",
        ) from None
