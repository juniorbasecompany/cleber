from __future__ import annotations

from typing import Any

from sqlalchemy import inspect
from sqlalchemy.orm import Session

# Primeira rodada de exemplos para revisão posterior.
NULL_IF_EMPTY_EXAMPLE_MAP: dict[str, object] = {
    "TEXT": "",
    "CHAR": "",
    "INTEGER": 0,
    "BIGINT": 0,
    "DATE": "",
    "TIMESTAMPTZ": "",
    "JSONB": {},
}

def value_is_empty_for_type(column_type: str, value: object) -> bool:
    normalized_type = column_type.strip().upper()

    if normalized_type in {"TEXT", "CHAR", "VARCHAR"} or normalized_type.startswith(
        ("CHAR(", "VARCHAR(")
    ):
        return isinstance(value, str) and value == ""

    if normalized_type in {
        "INTEGER",
        "INT",
        "BIGINT",
        "SMALLINT",
        "NUMERIC",
        "DECIMAL",
        "FLOAT",
        "DOUBLE",
        "REAL",
    }:
        return value == 0

    if normalized_type in {"DATE", "TIMESTAMP", "TIMESTAMPTZ"}:
        return isinstance(value, str) and value == ""

    if normalized_type in {"JSON", "JSONB"}:
        return value == {}

    return False


def normalize_model_null_if_empty(instance: Any) -> bool:
    mapper = inspect(type(instance))
    column_list = list(mapper.columns)
    if not column_list:
        return False

    changed = False
    for column in column_list:
        if column.nullable is False:
            continue
        if column.info.get("null_if_empty") is not True:
            continue

        field_name = column.key
        value = getattr(instance, field_name)
        if value_is_empty_for_type(str(column.type), value):
            setattr(instance, field_name, None)
            changed = True

    return changed


def normalize_session_null_if_empty(session: Session) -> None:
    instance_id_set: set[int] = set()
    instance_list = list(session.new) + list(session.dirty)

    for instance in instance_list:
        instance_id = id(instance)
        if instance_id in instance_id_set:
            continue

        normalize_model_null_if_empty(instance)
        instance_id_set.add(instance_id)


def commit_session_with_null_if_empty(session: Session) -> None:
    normalize_session_null_if_empty(session)
    session.commit()
