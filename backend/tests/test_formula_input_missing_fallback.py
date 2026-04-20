"""Contrato de fallback para `${input:id}` ausente no cálculo de idade atual.

Quando a fórmula consegue produzir valor válido com `i_<id> = None` (ex.: via
`coalesce` ou ternário), o valor é usado. Caso contrário, mantém-se o mesmo 400
`current_age_formula_input_missing` de antes da mudança.
"""

from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from valora_backend.api.rules import (
    ScopeCurrentAgeCalculationRequest,
    calculate_scope_current_age,
)
from valora_backend.model.identity import Item, Kind, Location, Scope, Unity
from valora_backend.model.rules import Action, Event, Field, Formula, Input, Result

from test_member_directory_api import build_rules_session


def _seed_scope_with_target_formula(
    session,
    *,
    tenant_id: int,
    target_formula_statement_template: str,
    provide_source_input_value: str | None,
    initial_age_value: str = "0",
    final_age_value: str = "1",
    current_event_age: int = 1,
):
    """Cria a estrutura mínima para rodar uma fórmula no current_action.

    Campos criados no escopo: initial_age, current_age, final_age (obrigatórios
    pelo motor) + target_field (alvo da fórmula sob teste) + source_field
    (referenciado como ${input:source_field.id} na fórmula sob teste).

    `target_formula_statement_template` usa placeholders `{target}`, `{source}`
    e `{current}` para os respectivos `field.id`.

    Se `provide_source_input_value` for None, NENHUM `Input` para `source_field`
    é gravado no evento do current_action (simula input ausente). Caso contrário,
    grava o `Input` com o valor textual informado.

    `initial_age_value` / `final_age_value` configuram a janela da unidade
    (permite exercitar carry-forward ao escolher `final_age_value > current_event_age`).

    Retorna `(scope, unity, current_event, target_field, source_field)` para asserts.
    """
    scope = Scope(name="Teste", tenant_id=tenant_id)
    session.add(scope)
    session.flush()

    location = Location(
        name="L1",
        scope_id=scope.id,
        parent_location_id=None,
        sort_order=0,
    )
    kind = Kind(scope_id=scope.id, name="k")
    anchor_action = Action(scope_id=scope.id, sort_order=0)
    current_action = Action(scope_id=scope.id, sort_order=1)
    initial_field = Field(
        scope_id=scope.id,
        type="INTEGER",
        sort_order=0,
        is_initial_age=True,
        is_final_age=False,
        is_current_age=False,
    )
    current_field = Field(
        scope_id=scope.id,
        type="INTEGER",
        sort_order=1,
        is_initial_age=False,
        is_final_age=False,
        is_current_age=True,
    )
    final_field = Field(
        scope_id=scope.id,
        type="INTEGER",
        sort_order=2,
        is_initial_age=False,
        is_final_age=True,
        is_current_age=False,
    )
    target_field = Field(
        scope_id=scope.id,
        type="INTEGER",
        sort_order=3,
        is_initial_age=False,
        is_final_age=False,
        is_current_age=False,
    )
    source_field = Field(
        scope_id=scope.id,
        type="INTEGER",
        sort_order=4,
        is_initial_age=False,
        is_final_age=False,
        is_current_age=False,
    )
    session.add_all(
        [
            location,
            kind,
            anchor_action,
            current_action,
            initial_field,
            current_field,
            final_field,
            target_field,
            source_field,
        ]
    )
    session.flush()

    initial_seed_formula = Formula(
        action_id=anchor_action.id,
        sort_order=0,
        statement=f"${{field:{initial_field.id}}} = ${{input:{initial_field.id}}}",
    )
    current_seed_formula = Formula(
        action_id=anchor_action.id,
        sort_order=1,
        statement=f"${{field:{current_field.id}}} = ${{field:{initial_field.id}}}",
    )
    final_seed_formula = Formula(
        action_id=anchor_action.id,
        sort_order=2,
        statement=f"${{field:{final_field.id}}} = ${{input:{final_field.id}}}",
    )
    target_formula = Formula(
        action_id=current_action.id,
        sort_order=0,
        statement=target_formula_statement_template.format(
            target=target_field.id,
            source=source_field.id,
            current=current_field.id,
        ),
    )
    session.add_all(
        [
            initial_seed_formula,
            current_seed_formula,
            final_seed_formula,
            target_formula,
        ]
    )
    session.flush()

    item = Item(
        scope_id=scope.id,
        kind_id=kind.id,
        parent_item_id=None,
        sort_order=0,
    )
    session.add(item)
    session.flush()

    unity = Unity(
        name="U1",
        location_id=location.id,
        item_id_list=[item.id],
        creation_utc=datetime(2026, 4, 1, 0, 0, 0),
    )
    session.add(unity)
    session.flush()

    anchor_event = Event(
        unity_id=unity.id,
        location_id=location.id,
        item_id=item.id,
        action_id=anchor_action.id,
        age=0,
    )
    current_event = Event(
        unity_id=unity.id,
        location_id=location.id,
        item_id=item.id,
        action_id=current_action.id,
        age=current_event_age,
    )
    session.add_all([anchor_event, current_event])
    session.flush()

    input_row_list = [
        Input(event_id=anchor_event.id, field_id=initial_field.id, value=initial_age_value),
        Input(event_id=anchor_event.id, field_id=final_field.id, value=final_age_value),
    ]
    if provide_source_input_value is not None:
        input_row_list.append(
            Input(
                event_id=current_event.id,
                field_id=source_field.id,
                value=provide_source_input_value,
            )
        )
    session.add_all(input_row_list)
    session.commit()

    return scope, unity, current_event, target_field, source_field


def _target_result_numeric_value(response, *, event_id: int, target_field_id: int) -> int | None:
    for row in response.item_list:
        if (
            row.event_id == event_id
            and row.field_id == target_field_id
            and row.numeric_value is not None
        ):
            return int(row.numeric_value)
    return None


def test_missing_input_with_coalesce_fallback_uses_literal_fallback() -> None:
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, target_field, _ = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = coalesce(${{input:{source}}}, 99)"
            ),
            provide_source_input_value=None,
        )

        response = calculate_scope_current_age(
            scope_id=scope.id,
            body=ScopeCurrentAgeCalculationRequest(),
            member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
            session=session,
        )

        assert (
            _target_result_numeric_value(
                response,
                event_id=current_event.id,
                target_field_id=target_field.id,
            )
            == 99
        )


def test_missing_input_with_coalesce_field_fallback_uses_field_value() -> None:
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, target_field, _ = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = coalesce(${{input:{source}}}, ${{field:{current}}})"
            ),
            provide_source_input_value=None,
        )

        response = calculate_scope_current_age(
            scope_id=scope.id,
            body=ScopeCurrentAgeCalculationRequest(),
            member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
            session=session,
        )

        # ${field:current} foi semeado em 0 pelo anchor e nada atualizou no current_action.
        assert (
            _target_result_numeric_value(
                response,
                event_id=current_event.id,
                target_field_id=target_field.id,
            )
            == 0
        )


def test_present_input_with_coalesce_uses_input_value_not_fallback() -> None:
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, target_field, _ = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = coalesce(${{input:{source}}}, 99)"
            ),
            provide_source_input_value="42",
        )

        response = calculate_scope_current_age(
            scope_id=scope.id,
            body=ScopeCurrentAgeCalculationRequest(),
            member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
            session=session,
        )

        assert (
            _target_result_numeric_value(
                response,
                event_id=current_event.id,
                target_field_id=target_field.id,
            )
            == 42
        )


def test_missing_input_without_fallback_raises_current_age_formula_input_missing() -> None:
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, target_field, source_field = (
            _seed_scope_with_target_formula(
                session,
                tenant_id=tenant_id,
                target_formula_statement_template="${{field:{target}}} = ${{input:{source}}}",
                provide_source_input_value=None,
            )
        )

        with pytest.raises(HTTPException) as excinfo:
            calculate_scope_current_age(
                scope_id=scope.id,
                body=ScopeCurrentAgeCalculationRequest(),
                member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
                session=session,
            )

        detail = excinfo.value.detail
        assert isinstance(detail, dict)
        assert detail["code"] == "current_age_formula_input_missing"
        assert detail["event_id"] == current_event.id
        assert detail["field_id"] == source_field.id


def test_missing_input_with_coerce_failure_falls_back_to_input_missing_400() -> None:
    """`coalesce(${input}, None) + 1` falha em runtime por `None + 1`; como há input
    ausente, o motor levanta `current_age_formula_input_missing` em vez de erro genérico."""
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, _, source_field = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = coalesce(${{input:{source}}}, None) + 1"
            ),
            provide_source_input_value=None,
        )

        with pytest.raises(HTTPException) as excinfo:
            calculate_scope_current_age(
                scope_id=scope.id,
                body=ScopeCurrentAgeCalculationRequest(),
                member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
                session=session,
            )

        detail = excinfo.value.detail
        assert isinstance(detail, dict)
        assert detail["code"] == "current_age_formula_input_missing"
        assert detail["event_id"] == current_event.id
        assert detail["field_id"] == source_field.id


def test_carry_forward_reevaluates_formula_with_coalesce_field_fallback() -> None:
    """No carry-forward (idades sem evento real), fórmula com `coalesce(${input}, ${field})`
    deve re-avaliar usando `None` para o input e produzir o valor do fallback, em vez de
    simplesmente copiar o resultado real anterior.

    Setup: evento real com input=42 grava target=42 (real). Nas idades seguintes sem
    evento, a avaliação com `None` retorna `${field:current}`=0 (o fallback). Antes da
    mudança o carry-forward copiaria 42 dessas idades; agora ele re-avalia e grava 0.
    """
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, target_field, _ = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = coalesce(${{input:{source}}}, ${{field:{current}}})"
            ),
            provide_source_input_value="42",
            initial_age_value="0",
            final_age_value="3",
            current_event_age=1,
        )

        response = calculate_scope_current_age(
            scope_id=scope.id,
            body=ScopeCurrentAgeCalculationRequest(),
            member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
            session=session,
        )

        carry_row_value_list = [
            row.numeric_value
            for row in response.item_list
            if row.event_id == current_event.id
            and row.field_id == target_field.id
            and row.result_age > 0
        ]
        assert carry_row_value_list, "esperava linhas carry-forward para o target"
        # Todas as linhas carry-forward devem ter re-avaliado `coalesce(None, 0)` = 0,
        # não o 42 copiado do evento real. Isso prova que carry-forward re-avalia.
        assert all(int(value) == 0 for value in carry_row_value_list)


def test_carry_forward_copies_previous_value_when_formula_has_no_fallback() -> None:
    """Fórmula com input mas sem fallback (`${input} * 2`): no carry-forward a
    avaliação falha (None * 2 dá TypeError) e o motor mantém o comportamento antigo
    de copiar o último resultado real.

    Setup: evento real com input=5 grava target=10. Carry-forward tenta re-avaliar,
    cai em TypeError, e copia 10 para as idades seguintes.
    """
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, target_field, _ = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = ${{input:{source}}} * 2"
            ),
            provide_source_input_value="5",
            initial_age_value="0",
            final_age_value="3",
            current_event_age=1,
        )

        response = calculate_scope_current_age(
            scope_id=scope.id,
            body=ScopeCurrentAgeCalculationRequest(),
            member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
            session=session,
        )

        target_row_value_list = [
            row.numeric_value
            for row in response.item_list
            if row.event_id == current_event.id and row.field_id == target_field.id
        ]
        # Pelo menos 2 linhas: uma real e carry-forward pra preencher a janela.
        assert len(target_row_value_list) >= 2
        # Como a fórmula sem fallback falha ao re-avaliar com `None`, o motor copia
        # o valor 10 (=5*2) do resultado real para todas as idades da janela.
        assert all(int(value) == 10 for value in target_row_value_list)


def test_carry_forward_reevaluates_formula_without_input_as_before() -> None:
    """Fórmula sem `${input:...}` continua sendo re-avaliada no carry-forward como antes
    (smoke test: nada na regra de `None`-fallback afeta fórmulas sem input).

    A fórmula `${field:target} = ${field:current} + 10` não referencia input. Em
    carry-forward, avalia normalmente e produz o mesmo valor a cada idade (já que
    `${field:current}` é constante no `working_state` neste setup).
    """
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, target_field, _ = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = ${{field:{current}}} + 10"
            ),
            provide_source_input_value=None,
            initial_age_value="0",
            final_age_value="3",
            current_event_age=1,
        )

        response = calculate_scope_current_age(
            scope_id=scope.id,
            body=ScopeCurrentAgeCalculationRequest(),
            member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
            session=session,
        )

        target_row_value_list = [
            row.numeric_value
            for row in response.item_list
            if row.event_id == current_event.id and row.field_id == target_field.id
        ]
        assert len(target_row_value_list) >= 2
        # A fórmula não tem input; `${field:current}`=0 por todo o working_state deste
        # setup; logo todas as idades (real e carry-forward) produzem 10.
        assert all(int(value) == 10 for value in target_row_value_list)


def test_missing_input_with_coalesce_returning_none_fails_coerce_with_missing_400() -> None:
    """Se `coalesce` retorna `None` (fallback também None) e o target é INTEGER, a
    coerção falha; como havia input ausente, retorna `current_age_formula_input_missing`."""
    with build_rules_session() as (session, tenant_id):
        scope, _, current_event, _, source_field = _seed_scope_with_target_formula(
            session,
            tenant_id=tenant_id,
            target_formula_statement_template=(
                "${{field:{target}}} = coalesce(${{input:{source}}}, None)"
            ),
            provide_source_input_value=None,
        )

        with pytest.raises(HTTPException) as excinfo:
            calculate_scope_current_age(
                scope_id=scope.id,
                body=ScopeCurrentAgeCalculationRequest(),
                member=SimpleNamespace(role=2, tenant_id=tenant_id, account_id=1),
                session=session,
            )

        detail = excinfo.value.detail
        assert isinstance(detail, dict)
        assert detail["code"] == "current_age_formula_input_missing"
        assert detail["event_id"] == current_event.id
        assert detail["field_id"] == source_field.id
