from __future__ import annotations

from datetime import date, datetime

import pytest

from valora_backend.rules.field_sql_formula import (
    classify_field_sql_type,
    coerce_formula_result_to_temporal,
    parse_temporal_result_text,
    serialize_temporal_for_storage,
)


def test_classify_timestamp_and_date() -> None:
    assert classify_field_sql_type("TIMESTAMP").temporal_kind == "datetime"
    assert classify_field_sql_type("TIMESTAMPTZ").temporal_kind == "datetime"
    assert classify_field_sql_type("TIMESTAMP(6)").temporal_kind == "datetime"
    assert classify_field_sql_type("DATE").temporal_kind == "date"


def test_classify_rejects_unknown() -> None:
    with pytest.raises(ValueError, match="Unsupported field.type"):
        classify_field_sql_type("CIDR")


def test_round_trip_date_text() -> None:
    d = date(2024, 3, 15)
    text = serialize_temporal_for_storage(d, "date")
    assert text == "2024-03-15"
    assert parse_temporal_result_text(text, "date") == d


def test_round_trip_datetime_text() -> None:
    dt = datetime(2024, 3, 15, 14, 30, 0)
    text = serialize_temporal_for_storage(dt, "datetime")
    assert parse_temporal_result_text(text, "datetime") == dt


def test_coerce_datetime_from_date_result() -> None:
    out = coerce_formula_result_to_temporal(date(2024, 1, 1), "datetime")
    assert out == datetime(2024, 1, 1, 0, 0, 0)


def test_coerce_date_truncates_datetime() -> None:
    out = coerce_formula_result_to_temporal(datetime(2024, 1, 1, 12, 0, 0), "date")
    assert out == date(2024, 1, 1)
