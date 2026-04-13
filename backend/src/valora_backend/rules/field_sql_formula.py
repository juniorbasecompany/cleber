# Classificação de `field.type` (SQL) e valores temporais para o motor de fórmulas.

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from typing import Any, Literal

TemporalKind = Literal["date", "datetime"]
SqlFamily = Literal["text", "boolean", "integer", "numeric", "temporal"]


@dataclass(frozen=True)
class FieldSqlFormulaKind:
    family: SqlFamily
    temporal_kind: TemporalKind | None = None


def normalize_sql_type(sql_type: str) -> str:
    return " ".join(sql_type.strip().upper().split())


def classify_field_sql_type(sql_type: str) -> FieldSqlFormulaKind:
    """Classifica o tipo SQL do campo para execução de fórmulas. Levanta ValueError se não suportado."""
    normalized = normalize_sql_type(sql_type)
    if normalized in {"TEXT", "CHAR", "VARCHAR"} or normalized.startswith(
        ("CHAR(", "VARCHAR(")
    ):
        return FieldSqlFormulaKind("text", None)
    if normalized == "BOOLEAN":
        return FieldSqlFormulaKind("boolean", None)
    if normalized in {"INTEGER", "INT", "BIGINT", "SMALLINT"}:
        return FieldSqlFormulaKind("integer", None)
    if normalized in {"NUMERIC", "DECIMAL", "FLOAT", "REAL", "DOUBLE", "DOUBLE PRECISION"}:
        return FieldSqlFormulaKind("numeric", None)
    if normalized.startswith(("NUMERIC(", "DECIMAL(")):
        return FieldSqlFormulaKind("numeric", None)
    if normalized == "DATE":
        return FieldSqlFormulaKind("temporal", "date")
    if normalized.startswith("TIMESTAMP"):
        return FieldSqlFormulaKind("temporal", "datetime")
    if normalized.startswith("TIMESTAMPTZ"):
        return FieldSqlFormulaKind("temporal", "datetime")
    raise ValueError(f"Unsupported field.type for formula execution: {sql_type}")


# Default determinístico quando um campo referido ainda não tem valor no estado (documentar na skill).
DEFAULT_DATE = date(1970, 1, 1)
DEFAULT_DATETIME = datetime(1970, 1, 1, 0, 0, 0)

# Stubs para dry-run da RHS ao gravar a fórmula (valores neutros por família).
STUB_DATE = date(2000, 1, 1)
STUB_DATETIME = datetime(2000, 1, 1, 0, 0, 0)


def default_temporal_runtime(temporal_kind: TemporalKind) -> date | datetime:
    if temporal_kind == "date":
        return DEFAULT_DATE
    return DEFAULT_DATETIME


def stub_value_for_formula_dry_run(sql_type: str) -> Any:
    """Valor stub para validação estática (RHS) conforme o tipo SQL do campo referido."""
    kind = classify_field_sql_type(sql_type)
    if kind.family == "text":
        return ""
    if kind.family == "boolean":
        return False
    if kind.family == "integer":
        return 0
    if kind.family == "numeric":
        return 0
    assert kind.temporal_kind is not None
    if kind.temporal_kind == "date":
        return STUB_DATE
    return STUB_DATETIME


def parse_temporal_input_string(raw: str, temporal_kind: TemporalKind) -> date | datetime:
    """Converte texto de input do utilizador para date/datetime naive."""
    s = raw.strip()
    if not s:
        raise ValueError("empty temporal string")
    if temporal_kind == "date":
        return date.fromisoformat(s)
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt


def parse_temporal_result_text(
    text: str | None, temporal_kind: TemporalKind
) -> date | datetime | None:
    """Lê texto persistido em result.text_value."""
    if text is None:
        return None
    stripped = text.strip()
    if stripped == "":
        return None
    if temporal_kind == "date":
        return date.fromisoformat(stripped)
    if stripped.endswith("Z"):
        stripped = stripped[:-1]
    dt = datetime.fromisoformat(stripped)
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt


def serialize_temporal_for_storage(value: date | datetime, temporal_kind: TemporalKind) -> str:
    """Serializa para gravar em result.text_value (ISO)."""
    if temporal_kind == "date":
        if isinstance(value, datetime):
            coerced = value.date()
        else:
            coerced = value
        return coerced.isoformat()
    if isinstance(value, date) and not isinstance(value, datetime):
        value = datetime.combine(value, time.min)
    assert isinstance(value, datetime)
    if value.tzinfo is not None:
        value = value.replace(tzinfo=None)
    return value.isoformat(timespec="seconds")


def coerce_formula_result_to_temporal(
    value: Any,
    temporal_kind: TemporalKind,
) -> date | datetime:
    """
    Converte o resultado avaliado da RHS para date/datetime naive.
    Levanta ValueError se o valor não puder ser interpretado.
    """
    if temporal_kind == "date":
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            return date.fromisoformat(value.strip())
        raise ValueError("formula temporal result must be date, datetime, or ISO date string")
    if isinstance(value, datetime):
        if value.tzinfo is not None:
            return value.replace(tzinfo=None)
        return value
    if isinstance(value, date):
        return datetime.combine(value, time.min)
    if isinstance(value, str):
        s = value.strip()
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)
        return dt
    raise ValueError("formula temporal result must be datetime, date, or ISO string")
