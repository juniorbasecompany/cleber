from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from datetime import UTC, date, datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from valora_backend.api.rules import (
    ScopeCurrentAgeCalculationRequest,
    calculate_scope_current_age,
    read_scope_current_age,
)
from valora_backend.config import Settings
from valora_backend.model.identity import Member
from valora_backend.model.rules import Action, Field, Formula, Label

FORMULA_REFERENCE_TOKEN = re.compile(r"\$\{(field|input):(\d+)\}")


@dataclass(frozen=True)
class OrderedResultRow:
    row_index: int
    result_id: int
    event_id: int
    result_day: date
    result_moment_utc: datetime
    event_moment_utc: datetime
    location_id: int
    item_id: int
    action_id: int
    action_sort_order: int
    action_label: str
    formula_id: int
    formula_order: int
    formula_statement: str
    status: str


def _parse_datetime(value: str) -> datetime:
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is not None:
        return parsed.astimezone(UTC)
    return parsed.replace(tzinfo=UTC)


def _pick_member(session, member_id: int | None) -> Member:
    query = select(Member).where(
        Member.status == 1,
        Member.role.in_((1, 2)),
        Member.tenant_id.is_not(None),
    )
    if member_id is not None:
        query = query.where(Member.id == member_id)
    else:
        query = query.order_by(Member.id.asc()).limit(1)

    member = session.scalar(query)
    if member is None:
        raise RuntimeError("Nenhum member master/admin ativo foi encontrado no banco local.")
    return member


def _load_field_label_by_id(
    session,
    *,
    scope_id: int,
    label_lang: str,
) -> dict[int, str]:
    field_row_list = list(
        session.execute(
            select(Field.id)
            .where(Field.scope_id == scope_id)
            .order_by(Field.sort_order.asc(), Field.id.asc())
        )
    )
    field_id_list = [int(field_id) for (field_id,) in field_row_list]
    label_by_field_id = {
        int(field_id): name
        for field_id, name in session.execute(
            select(Label.field_id, Label.name).where(
                Label.field_id.in_(field_id_list),
                Label.lang == label_lang,
            )
        )
        if field_id is not None
    }

    field_label_by_id: dict[int, str] = {}
    for field_id in field_id_list:
        field_label_by_id[field_id] = (label_by_field_id.get(field_id) or f"#{field_id}").strip()
    return field_label_by_id


def _load_action_meta_by_id(
    session,
    *,
    scope_id: int,
    label_lang: str,
) -> dict[int, tuple[int, str]]:
    action_row_list = list(
        session.execute(
            select(Action.id, Action.sort_order)
            .where(Action.scope_id == scope_id)
            .order_by(Action.sort_order.asc(), Action.id.asc())
        )
    )
    action_id_list = [int(action_id) for action_id, _sort_order in action_row_list]
    label_by_action_id = {
        int(action_id): name
        for action_id, name in session.execute(
            select(Label.action_id, Label.name).where(
                Label.action_id.in_(action_id_list),
                Label.lang == label_lang,
            )
        )
        if action_id is not None
    }

    action_meta_by_id: dict[int, tuple[int, str]] = {}
    for action_id, sort_order in action_row_list:
        action_meta_by_id[int(action_id)] = (
            int(sort_order),
            (label_by_action_id.get(int(action_id)) or f"#{action_id}").strip(),
        )
    return action_meta_by_id


def _format_formula_statement(
    statement: str,
    field_label_by_id: dict[int, str],
) -> str:
    def replace(match: re.Match[str]) -> str:
        field_id = int(match.group(2))
        return field_label_by_id.get(field_id, f"#{field_id}")

    return FORMULA_REFERENCE_TOKEN.sub(replace, statement)


def _load_formula_meta_by_id(
    session,
    *,
    scope_id: int,
    field_label_by_id: dict[int, str],
) -> dict[int, tuple[int, str]]:
    formula_row_list = list(
        session.execute(
            select(Formula.id, Formula.sort_order, Formula.statement)
            .join(Action, Formula.action_id == Action.id)
            .where(Action.scope_id == scope_id)
            .order_by(Formula.action_id.asc(), Formula.sort_order.asc(), Formula.id.asc())
        )
    )

    formula_meta_by_id: dict[int, tuple[int, str]] = {}
    for formula_id, sort_order, statement in formula_row_list:
        formula_meta_by_id[int(formula_id)] = (
            int(sort_order),
            _format_formula_statement(statement, field_label_by_id),
        )
    return formula_meta_by_id


def _expected_sort_key(row: OrderedResultRow) -> tuple[object, ...]:
    return (
        row.result_day.isoformat(),
        row.action_sort_order,
        row.formula_order,
        row.location_id,
        row.item_id,
        row.event_moment_utc.isoformat(),
        row.event_id,
        row.formula_id,
        row.result_id,
    )


def _print_action_order(action_meta_by_id: dict[int, tuple[int, str]]) -> None:
    print("ORDEM_DE_ACOES_CONFIGURADA")
    print("==========================")
    for action_id, (sort_order, label) in sorted(
        action_meta_by_id.items(),
        key=lambda item: (item[1][0], item[0]),
    ):
        print(f"  sort_order={sort_order:<3} action_id={action_id:<4} label={label}")


def _print_result_rows(title: str, row_list: list[OrderedResultRow]) -> None:
    print()
    print(title)
    print("=" * len(title))
    if not row_list:
        print("  nenhum resultado")
        return

    for display_index, row in enumerate(row_list):
        print(
            f"  pos={display_index:<3}"
            f" source_idx={row.row_index:<3}"
            f" day={row.result_day.isoformat()}"
            f" action_sort={row.action_sort_order:<3}"
            f" action={row.action_label:<28}"
            f" formula_order={row.formula_order:<3}"
            f" event_id={row.event_id:<5}"
            f" result_id={row.result_id:<5}"
            f" result_moment={row.result_moment_utc.isoformat()}"
            f" formula={row.formula_statement}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Checa se os resultados de idade atual estao ordenados por dia, "
            "action.sort_order e formula.sort_order."
        )
    )
    parser.add_argument("--member-id", type=int, default=1)
    parser.add_argument("--scope-id", type=int)
    parser.add_argument("--moment-from-utc", default="2026-04-01T00:00:00Z")
    parser.add_argument("--moment-to-utc", default="2026-04-30T23:59:59Z")
    parser.add_argument(
        "--mode",
        choices=("read", "calculate"),
        default="read",
        help="read: usa resultados ja materializados; calculate: recalcula no backend.",
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="No modo calculate, mantem o commit real. Sem essa flag, faz rollback no fim.",
    )
    parser.add_argument(
        "--label-lang",
        default="pt-BR",
        choices=("pt-BR", "en", "es"),
    )
    args = parser.parse_args()

    settings = Settings()
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    moment_from_utc = _parse_datetime(args.moment_from_utc)
    moment_to_utc = _parse_datetime(args.moment_to_utc)

    with SessionLocal() as session:
        member = _pick_member(session, args.member_id)
        scope_id = args.scope_id or member.current_scope_id
        if scope_id is None:
            raise RuntimeError("O member selecionado nao possui current_scope_id.")

        action_meta_by_id = _load_action_meta_by_id(
            session,
            scope_id=scope_id,
            label_lang=args.label_lang,
        )
        field_label_by_id = _load_field_label_by_id(
            session,
            scope_id=scope_id,
            label_lang=args.label_lang,
        )
        formula_meta_by_id = _load_formula_meta_by_id(
            session,
            scope_id=scope_id,
            field_label_by_id=field_label_by_id,
        )

        request = ScopeCurrentAgeCalculationRequest(
            moment_from_utc=moment_from_utc.isoformat().replace("+00:00", "Z"),
            moment_to_utc=moment_to_utc.isoformat().replace("+00:00", "Z"),
        )

        try:
            if args.mode == "calculate":
                response = calculate_scope_current_age(
                    scope_id=scope_id,
                    body=request,
                    member=member,
                    session=session,
                )
            else:
                response = read_scope_current_age(
                    scope_id=scope_id,
                    body=request,
                    member=member,
                    session=session,
                )
        except HTTPException as exc:
            print(f"Falha ao obter resultados: status={exc.status_code} detail={exc.detail}")
            return 2

        actual_row_list: list[OrderedResultRow] = []
        for index, row in enumerate(response.item_list):
            action_sort_order, action_label = action_meta_by_id.get(
                row.action_id,
                (10**9, f"#{row.action_id}"),
            )
            formula_order, formula_statement = formula_meta_by_id.get(
                row.formula_id,
                (row.formula_order, f"#{row.formula_id}"),
            )
            actual_row_list.append(
                OrderedResultRow(
                    row_index=index,
                    result_id=row.result_id,
                    event_id=row.event_id,
                    result_day=row.result_moment_utc.date(),
                    result_moment_utc=row.result_moment_utc.replace(tzinfo=UTC),
                    event_moment_utc=row.event_moment_utc.replace(tzinfo=UTC),
                    location_id=row.location_id,
                    item_id=row.item_id,
                    action_id=row.action_id,
                    action_sort_order=action_sort_order,
                    action_label=action_label,
                    formula_id=row.formula_id,
                    formula_order=formula_order,
                    formula_statement=formula_statement,
                    status=row.status,
                )
            )

        expected_row_list = sorted(actual_row_list, key=_expected_sort_key)

        print(f"database_url={settings.database_url}")
        print(f"scope_id={scope_id}")
        print(f"member_id={member.id}")
        print(f"mode={args.mode}")
        print(f"moment_from_utc={moment_from_utc.isoformat()}")
        print(f"moment_to_utc={moment_to_utc.isoformat()}")
        _print_action_order(action_meta_by_id)
        _print_result_rows("ORDEM_ATUAL_DA_RESPOSTA", actual_row_list)

        if actual_row_list == expected_row_list:
            print()
            print("OK: a resposta ja esta na ordem esperada.")
            if args.mode == "calculate" and not args.commit:
                session.rollback()
            elif args.mode == "calculate":
                session.commit()
            return 0

        _print_result_rows("ORDEM_ESPERADA", expected_row_list)

        print()
        print("ERRO: a resposta nao esta na ordem esperada.")
        for actual_row, expected_row in zip(actual_row_list, expected_row_list, strict=False):
            if actual_row == expected_row:
                continue
            print(
                "primeira_diferenca="
                f" atual(idx={actual_row.row_index}, action={actual_row.action_label},"
                f" formula_order={actual_row.formula_order}, result_id={actual_row.result_id})"
                f" esperado(idx={expected_row.row_index}, action={expected_row.action_label},"
                f" formula_order={expected_row.formula_order}, result_id={expected_row.result_id})"
            )
            break

        if args.mode == "calculate" and not args.commit:
            session.rollback()
        elif args.mode == "calculate":
            session.commit()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
