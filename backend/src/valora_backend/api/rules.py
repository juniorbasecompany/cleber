# API REST do domínio de regras por escopo (field, action, formula, label, event, input, result).

from __future__ import annotations

import logging
from collections import defaultdict
from decimal import Decimal
from datetime import UTC, datetime
from typing import Annotated, Literal

import requests
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field as PydanticField, model_validator
from sqlalchemy import func, or_, select, text, true
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from valora_backend.auth.dependencies import get_current_member
from valora_backend.auth.service import ADMIN_ROLE, MASTER_ROLE
from valora_backend.db import get_session
from valora_backend.model.identity import Item, Location, Member, Scope
from valora_backend.model.rules import (
    Action,
    Event,
    Field,
    Formula,
    Input,
    Label,
    Result,
)
from valora_backend.api.auth import (
    _apply_member_audit_context,
    _normalize_expression_for_search,
    _query_term_expression_for_search,
)
from valora_backend.config import Settings
from valora_backend.model.null_if_empty import commit_session_with_null_if_empty
from valora_backend.rules.formula_statement_validate import (
    FormulaStatementValidationError,
    validate_formula_statement_for_scope,
)
from valora_backend.services.deepl_label_translation import (
    FIELD_LABEL_LANG_LIST,
    normalize_deepl_api_key,
    resolve_deepl_api_base_url,
    translate_text_deepl,
)

router = APIRouter(prefix="/auth/tenant/current", tags=["scope-rules"])


def _normalize_optional_result_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _member_can_edit_scope_rules(member: Member) -> bool:
    return member.role in (MASTER_ROLE, ADMIN_ROLE)


def _require_scope_rules_editor(member: Member) -> None:
    if not _member_can_edit_scope_rules(member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for this operation",
        )


def _get_tenant_scope(session: Session, *, actor: Member, scope_id: int) -> Scope:
    target = session.get(Scope, scope_id)
    if not target or target.tenant_id != actor.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scope not found for current tenant",
        )
    return target


def _field_in_scope_or_404(
    session: Session, *, scope_id: int, field_id: int
) -> Field:
    row = session.get(Field, field_id)
    if not row or row.scope_id != scope_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found for current scope",
        )
    return row


def _action_in_scope_or_404(
    session: Session, *, scope_id: int, action_id: int
) -> Action:
    row = session.get(Action, action_id)
    if not row or row.scope_id != scope_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found for current scope",
        )
    return row


def _formula_statement_validation_error(
    exc: FormulaStatementValidationError,
    *,
    formula_sort_order: int | None = None,
) -> HTTPException:
    detail: dict[str, str | int] = {"code": exc.code, "message": exc.message}
    if formula_sort_order is not None:
        detail["sort_order"] = formula_sort_order
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=detail,
    )


def _formula_in_action_or_404(
    session: Session, *, action_id: int, formula_id: int
) -> Formula:
    row = session.get(Formula, formula_id)
    if not row or row.action_id != action_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formula not found for this action",
        )
    return row


def _field_is_referenced_by_scope_formula(
    session: Session, *, scope_id: int, field_id: int
) -> bool:
    field_token = f"${{field:{field_id}}}"
    input_token = f"${{input:{field_id}}}"
    return session.scalar(
        select(Formula.id)
        .join(Action, Formula.action_id == Action.id)
        .where(
            Action.scope_id == scope_id,
            or_(
                Formula.statement.contains(field_token),
                Formula.statement.contains(input_token),
            ),
        )
        .limit(1)
    ) is not None


def _location_in_scope_or_404(
    session: Session, *, scope_id: int, location_id: int
) -> Location:
    row = session.get(Location, location_id)
    if not row or row.scope_id != scope_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found for current scope",
        )
    return row


def _expand_scope_location_id_list_with_descendants(
    session: Session, *, scope_id: int, location_id_list: list[int]
) -> list[int]:
    """Cada id selecionado vira ele próprio mais todos os descendentes no escopo."""
    if not location_id_list:
        return []
    rows = list(
        session.execute(
            select(Location.id, Location.parent_location_id).where(
                Location.scope_id == scope_id
            )
        )
    )
    children_by_parent: defaultdict[int | None, list[int]] = defaultdict(list)
    for loc_id, parent_id in rows:
        children_by_parent[parent_id].append(loc_id)
    expanded: set[int] = set()
    stack = list(location_id_list)
    while stack:
        current = stack.pop()
        if current in expanded:
            continue
        expanded.add(current)
        stack.extend(children_by_parent.get(current, ()))
    return list(expanded)


def _expand_scope_item_id_list_with_descendants(
    session: Session, *, scope_id: int, item_id_list: list[int]
) -> list[int]:
    """Cada id selecionado vira ele próprio mais todos os itens descendentes no escopo."""
    if not item_id_list:
        return []
    rows = list(
        session.execute(
            select(Item.id, Item.parent_item_id).where(Item.scope_id == scope_id)
        )
    )
    children_by_parent: defaultdict[int | None, list[int]] = defaultdict(list)
    for item_row_id, parent_id in rows:
        children_by_parent[parent_id].append(item_row_id)
    expanded: set[int] = set()
    stack = list(item_id_list)
    while stack:
        current = stack.pop()
        if current in expanded:
            continue
        expanded.add(current)
        stack.extend(children_by_parent.get(current, ()))
    return list(expanded)


def _item_in_scope_or_404(
    session: Session, *, scope_id: int, item_id: int
) -> Item:
    row = session.get(Item, item_id)
    if not row or row.scope_id != scope_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found for current scope",
        )
    return row


def _event_in_scope_or_404(
    session: Session, *, scope_id: int, event_id: int
) -> Event:
    row = session.get(Event, event_id)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    action = session.get(Action, row.action_id)
    if not action or action.scope_id != scope_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found for current scope",
        )
    return row


def _input_in_event_or_404(
    session: Session, *, event_id: int, input_id: int
) -> Input:
    row = session.get(Input, input_id)
    if not row or row.event_id != event_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Input not found for this event",
        )
    return row


def _result_in_event_or_404(
    session: Session, *, event_id: int, result_id: int
) -> Result:
    row = session.get(Result, result_id)
    if not row or row.event_id != event_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found for this event",
        )
    return row


def _label_in_scope_or_404(
    session: Session, *, scope_id: int, label_id: int
) -> Label:
    row = session.get(Label, label_id)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found",
        )
    if row.field_id is not None:
        field = session.get(Field, row.field_id)
        if not field or field.scope_id != scope_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Label not found for current scope",
            )
    elif row.action_id is not None:
        action = session.get(Action, row.action_id)
        if not action or action.scope_id != scope_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Label not found for current scope",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found for current scope",
        )
    return row


def _upsert_field_label_by_lang(
    session: Session,
    *,
    field_id: int,
    lang: str,
    name: str | None,
) -> None:
    """Atualiza ou cria `label` para o campo e idioma. Texto vazio após strip remove o registro."""
    if name is None:
        return
    stripped = name.strip()
    existing = session.scalar(
        select(Label).where(Label.field_id == field_id, Label.lang == lang)
    )
    if not stripped:
        if existing is not None:
            session.delete(existing)
        return
    if existing is not None:
        existing.name = stripped
        session.add(existing)
        return
    session.add(
        Label(lang=lang, name=stripped, field_id=field_id, action_id=None)
    )


def _fill_other_field_labels_via_deepl(
    session: Session,
    *,
    field_id: int,
    source_lang: str,
    source_text: str,
) -> None:
    """Preenche rótulos nas outras línguas via DeepL; ignora sem chave ou se um idioma falhar."""
    settings = Settings()
    key_secret = settings.deepl_api_key
    if key_secret is None:
        return
    stripped = source_text.strip()
    if not stripped:
        return
    api_key = normalize_deepl_api_key(key_secret.get_secret_value())
    if not api_key:
        return
    base = resolve_deepl_api_base_url(
        configured_url=settings.deepl_api_base_url,
        api_key=api_key,
    ).rstrip("/")
    log = logging.getLogger(__name__)
    for target_lang in FIELD_LABEL_LANG_LIST:
        if target_lang == source_lang:
            continue
        try:
            translated, _ = translate_text_deepl(
                text=stripped,
                source_app_lang=source_lang,
                target_app_lang=target_lang,
                api_key=api_key,
                base_url=base,
            )
        except (requests.RequestException, ValueError) as exc:
            extra = ""
            if isinstance(exc, requests.HTTPError) and exc.response is not None:
                extra = f" response={exc.response.text[:400]!r}"
            log.warning(
                "DeepL translation failed for field_id=%s target_lang=%s base_url=%s: %s%s",
                field_id,
                target_lang,
                base,
                exc,
                extra,
            )
            continue
        if translated:
            _upsert_field_label_by_lang(
                session,
                field_id=field_id,
                lang=target_lang,
                name=translated,
            )


def _upsert_action_label_by_lang(
    session: Session,
    *,
    action_id: int,
    lang: str,
    name: str | None,
) -> None:
    """Atualiza ou cria `label` para a ação e idioma. Texto vazio após strip remove o registro."""
    if name is None:
        return
    stripped = name.strip()
    existing = session.scalar(
        select(Label).where(Label.action_id == action_id, Label.lang == lang)
    )
    if not stripped:
        if existing is not None:
            session.delete(existing)
        return
    if existing is not None:
        existing.name = stripped
        session.add(existing)
        return
    session.add(
        Label(lang=lang, name=stripped, field_id=None, action_id=action_id)
    )


def _fill_other_action_labels_via_deepl(
    session: Session,
    *,
    action_id: int,
    source_lang: str,
    source_text: str,
) -> None:
    """Preenche rótulos nas outras línguas via DeepL; ignora sem chave ou se um idioma falhar."""
    settings = Settings()
    key_secret = settings.deepl_api_key
    if key_secret is None:
        return
    stripped = source_text.strip()
    if not stripped:
        return
    api_key = normalize_deepl_api_key(key_secret.get_secret_value())
    if not api_key:
        return
    base = resolve_deepl_api_base_url(
        configured_url=settings.deepl_api_base_url,
        api_key=api_key,
    ).rstrip("/")
    log = logging.getLogger(__name__)
    for target_lang in FIELD_LABEL_LANG_LIST:
        if target_lang == source_lang:
            continue
        try:
            translated, _ = translate_text_deepl(
                text=stripped,
                source_app_lang=source_lang,
                target_app_lang=target_lang,
                api_key=api_key,
                base_url=base,
            )
        except (requests.RequestException, ValueError) as exc:
            extra = ""
            if isinstance(exc, requests.HTTPError) and exc.response is not None:
                extra = f" response={exc.response.text[:400]!r}"
            log.warning(
                "DeepL translation failed for action_id=%s target_lang=%s base_url=%s: %s%s",
                action_id,
                target_lang,
                base,
                exc,
                extra,
            )
            continue
        if translated:
            _upsert_action_label_by_lang(
                session,
                action_id=action_id,
                lang=target_lang,
                name=translated,
            )


# --- field ---


def _resequence_fields_in_scope(session: Session, *, scope_id: int) -> None:
    rows = list(
        session.scalars(
            select(Field)
            .where(Field.scope_id == scope_id)
            .order_by(Field.sort_order, Field.id)
        )
    )
    for index, row in enumerate(rows):
        row.sort_order = index


def _resequence_actions_in_scope(session: Session, *, scope_id: int) -> None:
    rows = list(
        session.scalars(
            select(Action)
            .where(Action.scope_id == scope_id)
            .order_by(Action.sort_order, Action.id)
        )
    )
    for index, row in enumerate(rows):
        row.sort_order = index


def _next_field_sort_order(session: Session, *, scope_id: int) -> int:
    current_max = session.scalar(
        select(func.coalesce(func.max(Field.sort_order), -1)).where(
            Field.scope_id == scope_id
        )
    )
    return int(current_max) + 1


def _next_action_sort_order(session: Session, *, scope_id: int) -> int:
    current_max = session.scalar(
        select(func.coalesce(func.max(Action.sort_order), -1)).where(
            Action.scope_id == scope_id
        )
    )
    return int(current_max) + 1


class ScopeFieldRecord(BaseModel):
    id: int
    scope_id: int
    sql_type: str
    sort_order: int
    is_initial_age: bool
    is_final_age: bool
    is_current_age: bool
    label_id: int | None = None
    label_name: str | None = None


class ScopeFieldListResponse(BaseModel):
    can_edit: bool
    item_list: list[ScopeFieldRecord]


class ScopeFieldCreateRequest(BaseModel):
    sql_type: str = PydanticField(min_length=1, max_length=2048)
    is_initial_age: bool = False
    is_final_age: bool = False
    is_current_age: bool = False
    label_lang: Literal["pt-BR", "en", "es"] | None = None
    label_name: str | None = PydanticField(default=None, max_length=2048)

    @model_validator(mode="after")
    def label_lang_when_name_sent(self) -> ScopeFieldCreateRequest:
        if self.label_name is not None and self.label_lang is None:
            raise ValueError("label_lang is required when label_name is provided")
        if self.is_initial_age and self.is_final_age:
            raise ValueError("field cannot be both initial_age and final_age")
        return self


class ScopeFieldPatchRequest(BaseModel):
    sql_type: str | None = PydanticField(default=None, min_length=1, max_length=2048)
    is_initial_age: bool | None = None
    is_final_age: bool | None = None
    is_current_age: bool | None = None
    label_lang: Literal["pt-BR", "en", "es"] | None = None
    label_name: str | None = PydanticField(default=None, max_length=2048)

    @model_validator(mode="after")
    def label_lang_when_name_sent_patch(self) -> ScopeFieldPatchRequest:
        if self.label_name is not None and self.label_lang is None:
            raise ValueError("label_lang is required when label_name is provided")
        if self.is_initial_age is True and self.is_final_age is True:
            raise ValueError("field cannot be both initial_age and final_age")
        return self


def _ensure_field_age_flag_availability(
    session: Session,
    *,
    scope_id: int,
    field_id: int | None,
    is_initial_age: bool,
    is_final_age: bool,
    is_current_age: bool,
) -> None:
    if is_initial_age:
        initial_owner_id = session.scalar(
            select(Field.id)
            .where(
                Field.scope_id == scope_id,
                Field.is_initial_age.is_(True),
                Field.id != field_id if field_id is not None else true(),
            )
            .limit(1)
        )
        if initial_owner_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another field in this scope is already marked as initial age",
            )

    if is_final_age:
        final_owner_id = session.scalar(
            select(Field.id)
            .where(
                Field.scope_id == scope_id,
                Field.is_final_age.is_(True),
                Field.id != field_id if field_id is not None else true(),
            )
            .limit(1)
        )
        if final_owner_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another field in this scope is already marked as final age",
            )

    if is_current_age:
        current_owner_id = session.scalar(
            select(Field.id)
            .where(
                Field.scope_id == scope_id,
                Field.is_current_age.is_(True),
                Field.id != field_id if field_id is not None else true(),
            )
            .limit(1)
        )
        if current_owner_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another field in this scope is already marked as current age",
            )


@router.get(
    "/scopes/{scope_id}/fields",
    response_model=ScopeFieldListResponse,
)
def list_scope_fields(
    scope_id: int,
    label_lang: Annotated[
        Literal["pt-BR", "en", "es"] | None,
        Query(),
    ] = None,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
    q: Annotated[str | None, Query()] = None,
):
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    field_query = select(Field).where(Field.scope_id == scope_id)
    query_term_expression = _query_term_expression_for_search(q)
    if query_term_expression is not None:
            if label_lang is None:
                field_query = field_query.where(
                    _normalize_expression_for_search(Field.type).contains(
                        query_term_expression
                    )
                )
            else:
                label_match_exists = (
                    select(Label.id)
                    .where(
                        Label.field_id == Field.id,
                        Label.lang == label_lang,
                        _normalize_expression_for_search(Label.name).contains(
                            query_term_expression
                        ),
                    )
                    .exists()
                )
                field_query = field_query.where(
                    or_(
                        _normalize_expression_for_search(Field.type).contains(
                            query_term_expression
                        ),
                        label_match_exists,
                    )
                )

    rows = list(
        session.scalars(
            field_query.order_by(Field.sort_order, Field.id)
        )
    )
    label_by_field_id: dict[int, Label] = {}
    if label_lang is not None and rows:
        field_id_list = [r.id for r in rows]
        label_rows = list(
            session.scalars(
                select(Label).where(
                    Label.field_id.in_(field_id_list),
                    Label.lang == label_lang,
                )
            )
        )
        for label_row in label_rows:
            if label_row.field_id is not None:
                label_by_field_id[label_row.field_id] = label_row

    item_list: list[ScopeFieldRecord] = []
    for r in rows:
        pair = label_by_field_id.get(r.id) if label_lang is not None else None
        item_list.append(
            ScopeFieldRecord(
                id=r.id,
                scope_id=r.scope_id,
                sql_type=r.type,
                sort_order=r.sort_order,
                is_initial_age=r.is_initial_age,
                is_final_age=r.is_final_age,
                is_current_age=r.is_current_age,
                label_id=pair.id if pair is not None else None,
                label_name=pair.name if pair is not None else None,
            )
        )

    return ScopeFieldListResponse(
        can_edit=_member_can_edit_scope_rules(member),
        item_list=item_list,
    )


@router.post(
    "/scopes/{scope_id}/fields",
    response_model=ScopeFieldListResponse,
    status_code=status.HTTP_200_OK,
)
def create_scope_field(
    scope_id: int,
    body: ScopeFieldCreateRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = Field(
        scope_id=scope_id,
        type=body.sql_type.strip(),
        sort_order=_next_field_sort_order(session, scope_id=scope_id),
        is_initial_age=body.is_initial_age,
        is_final_age=body.is_final_age,
        is_current_age=body.is_current_age,
    )
    _ensure_field_age_flag_availability(
        session,
        scope_id=scope_id,
        field_id=None,
        is_initial_age=body.is_initial_age,
        is_final_age=body.is_final_age,
        is_current_age=body.is_current_age,
    )
    session.add(row)
    session.flush()
    if body.label_lang is not None and body.label_name is not None:
        _upsert_field_label_by_lang(
            session,
            field_id=row.id,
            lang=body.label_lang,
            name=body.label_name,
        )
        _fill_other_field_labels_via_deepl(
            session,
            field_id=row.id,
            source_lang=body.label_lang,
            source_text=body.label_name,
        )
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_fields(scope_id, body.label_lang, member, session, None)


@router.get(
    "/scopes/{scope_id}/fields/{field_id}",
    response_model=ScopeFieldRecord,
)
def get_scope_field(
    scope_id: int,
    field_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _field_in_scope_or_404(session, scope_id=scope_id, field_id=field_id)
    return ScopeFieldRecord(
        id=row.id,
        scope_id=row.scope_id,
        sql_type=row.type,
        sort_order=row.sort_order,
        is_initial_age=row.is_initial_age,
        is_final_age=row.is_final_age,
        is_current_age=row.is_current_age,
    )


@router.patch(
    "/scopes/{scope_id}/fields/{field_id}",
    response_model=ScopeFieldListResponse,
)
def patch_scope_field(
    scope_id: int,
    field_id: int,
    body: ScopeFieldPatchRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _field_in_scope_or_404(session, scope_id=scope_id, field_id=field_id)
    next_is_initial_age = (
        body.is_initial_age
        if body.is_initial_age is not None
        else row.is_initial_age
    )
    next_is_final_age = (
        body.is_final_age
        if body.is_final_age is not None
        else row.is_final_age
    )
    next_is_current_age = (
        body.is_current_age
        if body.is_current_age is not None
        else row.is_current_age
    )
    if next_is_initial_age and next_is_final_age:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field cannot be both initial age and final age",
        )
    _ensure_field_age_flag_availability(
        session,
        scope_id=scope_id,
        field_id=row.id,
        is_initial_age=next_is_initial_age,
        is_final_age=next_is_final_age,
        is_current_age=next_is_current_age,
    )
    if body.sql_type is not None:
        row.type = body.sql_type.strip()
    if body.is_initial_age is not None:
        row.is_initial_age = body.is_initial_age
    if body.is_final_age is not None:
        row.is_final_age = body.is_final_age
    if body.is_current_age is not None:
        row.is_current_age = body.is_current_age
    session.add(row)
    if body.label_lang is not None and body.label_name is not None:
        _upsert_field_label_by_lang(
            session,
            field_id=row.id,
            lang=body.label_lang,
            name=body.label_name,
        )
        _fill_other_field_labels_via_deepl(
            session,
            field_id=row.id,
            source_lang=body.label_lang,
            source_text=body.label_name,
        )
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_fields(scope_id, body.label_lang, member, session, None)


@router.delete(
    "/scopes/{scope_id}/fields/{field_id}",
    response_model=ScopeFieldListResponse,
)
def delete_scope_field(
    scope_id: int,
    field_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _field_in_scope_or_404(session, scope_id=scope_id, field_id=field_id)
    if _field_is_referenced_by_scope_formula(
        session, scope_id=scope_id, field_id=row.id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete field while formulas reference it",
        )
    if session.scalar(select(Input.id).where(Input.field_id == row.id).limit(1)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete field while inputs reference it",
        )
    if session.scalar(select(Result.id).where(Result.field_id == row.id).limit(1)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete field while results reference it",
        )
    session.delete(row)
    session.flush()
    _resequence_fields_in_scope(session, scope_id=scope_id)
    _apply_member_audit_context(session, member)
    session.commit()
    return list_scope_fields(scope_id, None, member, session, None)


class ScopeFieldReorderRequest(BaseModel):
    field_id_list: list[int]


@router.post(
    "/scopes/{scope_id}/fields/reorder",
    response_model=ScopeFieldListResponse,
)
def reorder_scope_fields(
    scope_id: int,
    body: ScopeFieldReorderRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
    label_lang: Annotated[
        Literal["pt-BR", "en", "es"] | None,
        Query(),
    ] = None,
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    expected_id_set = set(
        session.scalars(select(Field.id).where(Field.scope_id == scope_id)).all()
    )
    received = body.field_id_list
    if len(received) != len(expected_id_set) or set(received) != expected_id_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="field_id_list must list every field in this scope exactly once",
        )
    for index, fid in enumerate(received):
        row = session.get(Field, fid)
        if row is None or row.scope_id != scope_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid field id in reorder list",
            )
        row.sort_order = index
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_fields(scope_id, label_lang, member, session, None)


# --- action ---


class ScopeActionRecord(BaseModel):
    id: int
    scope_id: int
    sort_order: int
    label_id: int | None = None
    label_name: str | None = None


class ScopeActionListResponse(BaseModel):
    can_edit: bool
    item_list: list[ScopeActionRecord]


class ScopeActionCreateRequest(BaseModel):
    label_lang: Literal["pt-BR", "en", "es"] | None = None
    label_name: str | None = PydanticField(default=None, max_length=2048)

    @model_validator(mode="after")
    def label_lang_when_name_sent(self) -> ScopeActionCreateRequest:
        if self.label_name is not None and self.label_lang is None:
            raise ValueError("label_lang is required when label_name is provided")
        return self


class ScopeActionPatchRequest(BaseModel):
    label_lang: Literal["pt-BR", "en", "es"] | None = None
    label_name: str | None = PydanticField(default=None, max_length=2048)

    @model_validator(mode="after")
    def label_lang_when_name_sent_patch(self) -> ScopeActionPatchRequest:
        if self.label_name is not None and self.label_lang is None:
            raise ValueError("label_lang is required when label_name is provided")
        return self


@router.get(
    "/scopes/{scope_id}/actions",
    response_model=ScopeActionListResponse,
)
def list_scope_actions(
    scope_id: int,
    label_lang: Annotated[
        Literal["pt-BR", "en", "es"] | None,
        Query(),
    ] = None,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
    q: Annotated[str | None, Query()] = None,
):
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    action_query = select(Action).where(Action.scope_id == scope_id)
    query_term_expression = _query_term_expression_for_search(q)
    if query_term_expression is not None:
            if label_lang is None:
                action_query = action_query.where(text("1=0"))
            else:
                label_match_exists = (
                    select(Label.id)
                    .where(
                        Label.action_id == Action.id,
                        Label.lang == label_lang,
                        _normalize_expression_for_search(Label.name).contains(
                            query_term_expression
                        ),
                    )
                    .exists()
                )
                action_query = action_query.where(label_match_exists)

    rows = list(
        session.scalars(
            action_query.order_by(Action.sort_order, Action.id)
        )
    )
    label_by_action_id: dict[int, Label] = {}
    if label_lang is not None and rows:
        action_id_list = [r.id for r in rows]
        label_rows = list(
            session.scalars(
                select(Label).where(
                    Label.action_id.in_(action_id_list),
                    Label.lang == label_lang,
                )
            )
        )
        for label_row in label_rows:
            if label_row.action_id is not None:
                label_by_action_id[label_row.action_id] = label_row

    item_list: list[ScopeActionRecord] = []
    for r in rows:
        pair = label_by_action_id.get(r.id) if label_lang is not None else None
        item_list.append(
            ScopeActionRecord(
                id=r.id,
                scope_id=r.scope_id,
                sort_order=r.sort_order,
                label_id=pair.id if pair is not None else None,
                label_name=pair.name if pair is not None else None,
            )
        )

    return ScopeActionListResponse(
        can_edit=_member_can_edit_scope_rules(member),
        item_list=item_list,
    )


@router.post(
    "/scopes/{scope_id}/actions",
    response_model=ScopeActionListResponse,
)
def create_scope_action(
    scope_id: int,
    body: ScopeActionCreateRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = Action(
        scope_id=scope_id,
        sort_order=_next_action_sort_order(session, scope_id=scope_id),
    )
    session.add(row)
    session.flush()
    if body.label_lang is not None and body.label_name is not None:
        _upsert_action_label_by_lang(
            session,
            action_id=row.id,
            lang=body.label_lang,
            name=body.label_name,
        )
        _fill_other_action_labels_via_deepl(
            session,
            action_id=row.id,
            source_lang=body.label_lang,
            source_text=body.label_name,
        )
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_actions(scope_id, body.label_lang, member, session, None)


@router.get(
    "/scopes/{scope_id}/actions/{action_id}",
    response_model=ScopeActionRecord,
)
def get_scope_action(
    scope_id: int,
    action_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    return ScopeActionRecord(
        id=row.id,
        scope_id=row.scope_id,
        sort_order=row.sort_order,
    )


@router.patch(
    "/scopes/{scope_id}/actions/{action_id}",
    response_model=ScopeActionListResponse,
)
def patch_scope_action(
    scope_id: int,
    action_id: int,
    body: ScopeActionPatchRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    if body.label_lang is not None and body.label_name is not None:
        _upsert_action_label_by_lang(
            session,
            action_id=row.id,
            lang=body.label_lang,
            name=body.label_name,
        )
        _fill_other_action_labels_via_deepl(
            session,
            action_id=row.id,
            source_lang=body.label_lang,
            source_text=body.label_name,
        )
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_actions(scope_id, body.label_lang, member, session, None)


@router.delete(
    "/scopes/{scope_id}/actions/{action_id}",
    response_model=ScopeActionListResponse,
)
def delete_scope_action(
    scope_id: int,
    action_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    if session.scalar(select(Event.id).where(Event.action_id == row.id).limit(1)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete action while events reference it",
        )
    session.delete(row)
    session.flush()
    _resequence_actions_in_scope(session, scope_id=scope_id)
    _apply_member_audit_context(session, member)
    session.commit()
    return list_scope_actions(scope_id, None, member, session, None)


class ScopeActionReorderRequest(BaseModel):
    action_id_list: list[int]


@router.post(
    "/scopes/{scope_id}/actions/reorder",
    response_model=ScopeActionListResponse,
)
def reorder_scope_actions(
    scope_id: int,
    body: ScopeActionReorderRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
    label_lang: Annotated[
        Literal["pt-BR", "en", "es"] | None,
        Query(),
    ] = None,
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    expected_id_set = set(
        session.scalars(select(Action.id).where(Action.scope_id == scope_id)).all()
    )
    received = body.action_id_list
    if len(received) != len(expected_id_set) or set(received) != expected_id_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="action_id_list must list every action in this scope exactly once",
        )
    for index, aid in enumerate(received):
        row = session.get(Action, aid)
        if row is None or row.scope_id != scope_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action id in reorder list",
            )
        row.sort_order = index
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_actions(scope_id, label_lang, member, session, None)


# --- formula ---


class ScopeFormulaRecord(BaseModel):
    id: int
    action_id: int
    sort_order: int
    statement: str


class ScopeFormulaListResponse(BaseModel):
    can_edit: bool
    item_list: list[ScopeFormulaRecord]


class ScopeFormulaCreateRequest(BaseModel):
    sort_order: int
    statement: str = PydanticField(min_length=1, max_length=65535)


class ScopeFormulaPatchRequest(BaseModel):
    sort_order: int | None = None
    statement: str | None = PydanticField(default=None, min_length=1, max_length=65535)


@router.get(
    "/scopes/{scope_id}/actions/{action_id}/formulas",
    response_model=ScopeFormulaListResponse,
)
def list_scope_action_formulas(
    scope_id: int,
    action_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    rows = list(
        session.scalars(
            select(Formula)
            .where(Formula.action_id == action_id)
            .order_by(Formula.sort_order, Formula.id)
        )
    )
    return ScopeFormulaListResponse(
        can_edit=_member_can_edit_scope_rules(member),
        item_list=[
            ScopeFormulaRecord(
                id=r.id,
                action_id=r.action_id,
                sort_order=r.sort_order,
                statement=r.statement,
            )
            for r in rows
        ],
    )


@router.post(
    "/scopes/{scope_id}/actions/{action_id}/formulas",
    response_model=ScopeFormulaListResponse,
)
def create_scope_action_formula(
    scope_id: int,
    action_id: int,
    body: ScopeFormulaCreateRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    try:
        validate_formula_statement_for_scope(
            session,
            scope_id=scope_id,
            statement=body.statement.strip(),
        )
    except FormulaStatementValidationError as exc:
        raise _formula_statement_validation_error(
            exc, formula_sort_order=body.sort_order
        ) from None
    row = Formula(
        action_id=action_id,
        sort_order=body.sort_order,
        statement=body.statement.strip(),
    )
    session.add(row)
    _apply_member_audit_context(session, member)
    try:
        commit_session_with_null_if_empty(session)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate sort_order for this action or invalid data",
        ) from exc
    return list_scope_action_formulas(scope_id, action_id, member, session)


@router.patch(
    "/scopes/{scope_id}/actions/{action_id}/formulas/{formula_id}",
    response_model=ScopeFormulaListResponse,
)
def patch_scope_action_formula(
    scope_id: int,
    action_id: int,
    formula_id: int,
    body: ScopeFormulaPatchRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    row = _formula_in_action_or_404(session, action_id=action_id, formula_id=formula_id)
    if body.sort_order is not None:
        row.sort_order = body.sort_order
    if body.statement is not None:
        try:
            validate_formula_statement_for_scope(
                session,
                scope_id=scope_id,
                statement=body.statement.strip(),
            )
        except FormulaStatementValidationError as exc:
            effective_sort = (
                body.sort_order
                if body.sort_order is not None
                else row.sort_order
            )
            raise _formula_statement_validation_error(
                exc, formula_sort_order=effective_sort
            ) from None
        row.statement = body.statement.strip()
    session.add(row)
    _apply_member_audit_context(session, member)
    try:
        commit_session_with_null_if_empty(session)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate sort_order for this action or invalid data",
        ) from exc
    return list_scope_action_formulas(scope_id, action_id, member, session)


@router.delete(
    "/scopes/{scope_id}/actions/{action_id}/formulas/{formula_id}",
    response_model=ScopeFormulaListResponse,
)
def delete_scope_action_formula(
    scope_id: int,
    action_id: int,
    formula_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    row = _formula_in_action_or_404(session, action_id=action_id, formula_id=formula_id)
    session.delete(row)
    _apply_member_audit_context(session, member)
    session.commit()
    return list_scope_action_formulas(scope_id, action_id, member, session)


# --- label ---


class ScopeLabelRecord(BaseModel):
    id: int
    lang: str
    name: str
    field_id: int | None
    action_id: int | None


class ScopeLabelListResponse(BaseModel):
    can_edit: bool
    item_list: list[ScopeLabelRecord]


class ScopeLabelCreateRequest(BaseModel):
    lang: Literal["pt-BR", "en", "es"]
    name: str = PydanticField(min_length=1, max_length=2048)
    field_id: int | None = None
    action_id: int | None = None

    @model_validator(mode="after")
    def xor_target(self) -> ScopeLabelCreateRequest:
        f, a = self.field_id, self.action_id
        if (f is None) == (a is None):
            raise ValueError("Informe exatamente um entre field_id e action_id")
        return self


class ScopeLabelPatchRequest(BaseModel):
    lang: Literal["pt-BR", "en", "es"] | None = None
    name: str | None = PydanticField(default=None, min_length=1, max_length=2048)
    field_id: int | None = None
    action_id: int | None = None

    @model_validator(mode="after")
    def xor_if_both_set(self) -> ScopeLabelPatchRequest:
        if self.field_id is not None and self.action_id is not None:
            raise ValueError("Informe no máximo um entre field_id e action_id")
        return self


@router.get(
    "/scopes/{scope_id}/labels",
    response_model=ScopeLabelListResponse,
)
def list_scope_labels(
    scope_id: int,
    field_id: Annotated[int | None, Query()] = None,
    action_id: Annotated[int | None, Query()] = None,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    if field_id is not None:
        _field_in_scope_or_404(session, scope_id=scope_id, field_id=field_id)
        q = select(Label).where(Label.field_id == field_id)
    elif action_id is not None:
        _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
        q = select(Label).where(Label.action_id == action_id)
    else:
        field_id_subq = select(Field.id).where(Field.scope_id == scope_id)
        action_id_subq = select(Action.id).where(Action.scope_id == scope_id)
        q = select(Label).where(
            or_(
                Label.field_id.in_(field_id_subq),
                Label.action_id.in_(action_id_subq),
            )
        )
    rows = list(session.scalars(q.order_by(Label.id)))
    return ScopeLabelListResponse(
        can_edit=_member_can_edit_scope_rules(member),
        item_list=[
            ScopeLabelRecord(
                id=r.id,
                lang=r.lang,
                name=r.name,
                field_id=r.field_id,
                action_id=r.action_id,
            )
            for r in rows
        ],
    )


@router.post(
    "/scopes/{scope_id}/labels",
    response_model=ScopeLabelListResponse,
)
def create_scope_label(
    scope_id: int,
    body: ScopeLabelCreateRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    if body.field_id is not None:
        _field_in_scope_or_404(session, scope_id=scope_id, field_id=body.field_id)
    else:
        _action_in_scope_or_404(session, scope_id=scope_id, action_id=body.action_id)  # type: ignore[arg-type]
    row = Label(
        lang=body.lang,
        name=body.name.strip(),
        field_id=body.field_id,
        action_id=body.action_id,
    )
    session.add(row)
    _apply_member_audit_context(session, member)
    try:
        commit_session_with_null_if_empty(session)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate label for this language and target",
        ) from exc
    return list_scope_labels(scope_id, None, None, member, session)


@router.patch(
    "/scopes/{scope_id}/labels/{label_id}",
    response_model=ScopeLabelListResponse,
)
def patch_scope_label(
    scope_id: int,
    label_id: int,
    body: ScopeLabelPatchRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _label_in_scope_or_404(session, scope_id=scope_id, label_id=label_id)
    if body.lang is not None:
        row.lang = body.lang
    if body.name is not None:
        row.name = body.name.strip()
    if body.field_id is not None or body.action_id is not None:
        if body.field_id is not None and body.action_id is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Informe no máximo um entre field_id e action_id",
            )
        if body.field_id is not None:
            _field_in_scope_or_404(session, scope_id=scope_id, field_id=body.field_id)
            row.field_id = body.field_id
            row.action_id = None
        elif body.action_id is not None:
            _action_in_scope_or_404(
                session, scope_id=scope_id, action_id=body.action_id
            )
            row.action_id = body.action_id
            row.field_id = None
    session.add(row)
    _apply_member_audit_context(session, member)
    try:
        commit_session_with_null_if_empty(session)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate label for this language and target",
        ) from exc
    return list_scope_labels(scope_id, None, None, member, session)


@router.delete(
    "/scopes/{scope_id}/labels/{label_id}",
    response_model=ScopeLabelListResponse,
)
def delete_scope_label(
    scope_id: int,
    label_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _label_in_scope_or_404(session, scope_id=scope_id, label_id=label_id)
    session.delete(row)
    _apply_member_audit_context(session, member)
    session.commit()
    return list_scope_labels(scope_id, None, None, member, session)


# --- event ---

# Mesmo separador que `UI_TEXT_SEPARATOR` no painel de eventos (frontend).
_EVENT_INPUT_SUMMARY_SEPARATOR = "\u00a0\u00a0●\u00a0\u00a0"


def _event_input_summary_by_event_id(
    session: Session,
    *,
    event_id_list: list[int],
    label_lang: Literal["pt-BR", "en", "es"],
) -> dict[int, str | None]:
    """Monta o texto de resumo dos inputs por evento (rótulo de campo + valor)."""
    if not event_id_list:
        return {}
    input_rows = list(
        session.scalars(
            select(Input)
            .where(Input.event_id.in_(event_id_list))
            .order_by(Input.event_id, Input.id)
        )
    )
    if not input_rows:
        return {eid: None for eid in event_id_list}

    field_id_set = {row.field_id for row in input_rows}
    label_rows = list(
        session.scalars(
            select(Label).where(
                Label.field_id.in_(field_id_set),
                Label.lang == label_lang,
            )
        )
    )
    label_by_field_id: dict[int, str] = {}
    for label_row in label_rows:
        if label_row.field_id is not None:
            label_by_field_id[label_row.field_id] = label_row.name

    segments_by_event: dict[int, list[str]] = defaultdict(list)
    for inp in input_rows:
        value_stripped = inp.value.strip()
        if not value_stripped:
            continue
        label = label_by_field_id.get(inp.field_id) or f"#{inp.field_id}"
        segments_by_event[inp.event_id].append(f"{label}: {value_stripped}")

    result: dict[int, str | None] = {}
    for eid in event_id_list:
        segments = segments_by_event.get(eid)
        if not segments:
            result[eid] = None
        else:
            result[eid] = _EVENT_INPUT_SUMMARY_SEPARATOR.join(segments)
    return result


class ScopeEventRecord(BaseModel):
    id: int
    location_id: int
    item_id: int
    action_id: int
    moment_utc: datetime
    input_summary: str | None = None


class ScopeEventListResponse(BaseModel):
    can_edit: bool
    item_list: list[ScopeEventRecord]


class ScopeEventCreateRequest(BaseModel):
    location_id: int
    item_id: int
    action_id: int
    moment_utc: datetime | None = None


class ScopeEventPatchRequest(BaseModel):
    location_id: int | None = None
    item_id: int | None = None
    action_id: int | None = None
    moment_utc: datetime | None = None


class ScopeCurrentAgeCalculationRequest(BaseModel):
    moment_from_utc: datetime
    moment_to_utc: datetime


class ScopeCurrentAgeCalculationRecord(BaseModel):
    event_id: int
    result_id: int
    field_id: int
    location_id: int
    item_id: int
    action_id: int
    event_moment_utc: datetime
    numeric_value: int
    source_initial_event_id: int
    source_initial_age: int
    source_final_event_id: int
    source_final_age: int
    status: Literal["created", "updated", "unchanged"]


class ScopeCurrentAgeCalculationResponse(BaseModel):
    can_edit: bool
    calculated_moment_utc: datetime
    created_count: int
    updated_count: int
    unchanged_count: int
    item_list: list[ScopeCurrentAgeCalculationRecord]


def _resolve_scope_age_fields_or_400(
    session: Session, *, scope_id: int
) -> tuple[Field, Field, Field]:
    field_list = list(
        session.scalars(select(Field).where(Field.scope_id == scope_id).order_by(Field.id))
    )
    initial_field = next((row for row in field_list if row.is_initial_age), None)
    final_field = next((row for row in field_list if row.is_final_age), None)
    current_field = next((row for row in field_list if row.is_current_age), None)

    if initial_field is None or final_field is None or current_field is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Current age calculation requires one initial age field, "
                "one final age field, and one current age field in this scope"
            ),
        )

    return initial_field, final_field, current_field


def _normalize_whole_age_or_400(
    value: Decimal | None, *, event_id: int, age_role: str
) -> int | None:
    if value is None:
        return None
    whole_value = value.to_integral_value()
    if value != whole_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Event {event_id} has a non-integer {age_role} age value; "
                "current age calculation only supports whole days"
            ),
        )
    return int(whole_value)


@router.get(
    "/scopes/{scope_id}/events",
    response_model=ScopeEventListResponse,
)
def list_scope_events(
    scope_id: int,
    moment_from_utc: Annotated[datetime | None, Query()] = None,
    moment_to_utc: Annotated[datetime | None, Query()] = None,
    location_id: Annotated[list[int] | None, Query()] = None,
    item_id: Annotated[list[int] | None, Query()] = None,
    action_id: Annotated[int | None, Query()] = None,
    label_lang: Annotated[
        Literal["pt-BR", "en", "es"],
        Query(description="Idioma dos rotulos no resumo de inputs por evento."),
    ] = "pt-BR",
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    # Chamadas diretas a esta funcao (ex.: apos POST/PATCH evento) nao passam por Depends;
    # sem normalizar, `label_lang` pode ser o objeto Query() em vez da string.
    if label_lang not in ("pt-BR", "en", "es"):
        label_lang = "pt-BR"

    location_id_list = location_id or []
    item_id_list = item_id or []

    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    if moment_from_utc is not None and moment_from_utc.tzinfo is not None:
        moment_from_utc = moment_from_utc.astimezone(UTC).replace(tzinfo=None)
    if moment_to_utc is not None and moment_to_utc.tzinfo is not None:
        moment_to_utc = moment_to_utc.astimezone(UTC).replace(tzinfo=None)
    if (
        moment_from_utc is not None
        and moment_to_utc is not None
        and moment_from_utc > moment_to_utc
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event period",
        )
    for location_id_item in location_id_list:
        _location_in_scope_or_404(
            session, scope_id=scope_id, location_id=location_id_item
        )
    for item_id_item in item_id_list:
        _item_in_scope_or_404(session, scope_id=scope_id, item_id=item_id_item)
    if action_id is not None:
        _action_in_scope_or_404(session, scope_id=scope_id, action_id=action_id)
    action_id_list = list(
        session.scalars(select(Action.id).where(Action.scope_id == scope_id))
    )
    if not action_id_list:
        return ScopeEventListResponse(
            can_edit=_member_can_edit_scope_rules(member),
            item_list=[],
        )
    query = select(Event).where(Event.action_id.in_(action_id_list))
    if moment_from_utc is not None:
        query = query.where(Event.moment_utc >= moment_from_utc)
    if moment_to_utc is not None:
        query = query.where(Event.moment_utc <= moment_to_utc)
    if location_id_list:
        expanded_location_id_list = _expand_scope_location_id_list_with_descendants(
            session, scope_id=scope_id, location_id_list=location_id_list
        )
        query = query.where(Event.location_id.in_(expanded_location_id_list))
    if item_id_list:
        expanded_item_id_list = _expand_scope_item_id_list_with_descendants(
            session, scope_id=scope_id, item_id_list=item_id_list
        )
        query = query.where(Event.item_id.in_(expanded_item_id_list))
    if action_id is not None:
        query = query.where(Event.action_id == action_id)
    rows = list(session.scalars(query.order_by(Event.moment_utc.asc(), Event.id.asc())))
    summary_by_event_id = _event_input_summary_by_event_id(
        session,
        event_id_list=[r.id for r in rows],
        label_lang=label_lang,
    )
    return ScopeEventListResponse(
        can_edit=_member_can_edit_scope_rules(member),
        item_list=[
            ScopeEventRecord(
                id=r.id,
                location_id=r.location_id,
                item_id=r.item_id,
                action_id=r.action_id,
                moment_utc=r.moment_utc,
                input_summary=summary_by_event_id.get(r.id),
            )
            for r in rows
        ],
    )


@router.post(
    "/scopes/{scope_id}/events",
    response_model=ScopeEventListResponse,
)
def create_scope_event(
    scope_id: int,
    body: ScopeEventCreateRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    _location_in_scope_or_404(session, scope_id=scope_id, location_id=body.location_id)
    _item_in_scope_or_404(session, scope_id=scope_id, item_id=body.item_id)
    action = _action_in_scope_or_404(
        session, scope_id=scope_id, action_id=body.action_id
    )
    moment = body.moment_utc or datetime.now(UTC)
    if moment.tzinfo is not None:
        moment = moment.astimezone(UTC).replace(tzinfo=None)
    row = Event(
        location_id=body.location_id,
        item_id=body.item_id,
        action_id=action.id,
        moment_utc=moment,
    )
    session.add(row)
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_events(
        scope_id=scope_id,
        moment_from_utc=None,
        moment_to_utc=None,
        location_id=None,
        item_id=None,
        action_id=None,
        label_lang="pt-BR",
        member=member,
        session=session,
    )


@router.patch(
    "/scopes/{scope_id}/events/{event_id}",
    response_model=ScopeEventListResponse,
)
def patch_scope_event(
    scope_id: int,
    event_id: int,
    body: ScopeEventPatchRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    if body.location_id is not None:
        _location_in_scope_or_404(
            session, scope_id=scope_id, location_id=body.location_id
        )
        row.location_id = body.location_id
    if body.item_id is not None:
        _item_in_scope_or_404(session, scope_id=scope_id, item_id=body.item_id)
        row.item_id = body.item_id
    if body.action_id is not None:
        _action_in_scope_or_404(session, scope_id=scope_id, action_id=body.action_id)
        row.action_id = body.action_id
    if body.moment_utc is not None:
        moment = body.moment_utc
        if moment.tzinfo is not None:
            moment = moment.astimezone(UTC).replace(tzinfo=None)
        row.moment_utc = moment
    session.add(row)
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_events(
        scope_id=scope_id,
        moment_from_utc=None,
        moment_to_utc=None,
        location_id=None,
        item_id=None,
        action_id=None,
        label_lang="pt-BR",
        member=member,
        session=session,
    )


@router.delete(
    "/scopes/{scope_id}/events/{event_id}",
    response_model=ScopeEventListResponse,
)
def delete_scope_event(
    scope_id: int,
    event_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)
    row = _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    if session.scalar(select(Result.id).where(Result.event_id == row.id).limit(1)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete event while results reference it",
        )
    session.delete(row)
    _apply_member_audit_context(session, member)
    session.commit()
    return list_scope_events(
        scope_id=scope_id,
        moment_from_utc=None,
        moment_to_utc=None,
        location_id=None,
        item_id=None,
        action_id=None,
        label_lang="pt-BR",
        member=member,
        session=session,
    )


@router.post(
    "/scopes/{scope_id}/events/calculate-current-age",
    response_model=ScopeCurrentAgeCalculationResponse,
)
def calculate_scope_current_age(
    scope_id: int,
    body: ScopeCurrentAgeCalculationRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _get_tenant_scope(session, actor=member, scope_id=scope_id)

    moment_from_utc = body.moment_from_utc
    moment_to_utc = body.moment_to_utc
    if moment_from_utc.tzinfo is not None:
        moment_from_utc = moment_from_utc.astimezone(UTC).replace(tzinfo=None)
    if moment_to_utc.tzinfo is not None:
        moment_to_utc = moment_to_utc.astimezone(UTC).replace(tzinfo=None)
    if moment_from_utc > moment_to_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event period",
        )

    initial_field, final_field, current_field = _resolve_scope_age_fields_or_400(
        session, scope_id=scope_id
    )

    event_row_list = list(
        session.scalars(
            select(Event)
            .join(Action, Event.action_id == Action.id)
            .where(
                Action.scope_id == scope_id,
                Event.moment_utc >= moment_from_utc,
                Event.moment_utc <= moment_to_utc,
            )
            .order_by(Event.moment_utc.asc(), Event.id.asc())
        )
    )
    calculated_moment_utc = datetime.now(UTC).replace(tzinfo=None)
    if not event_row_list:
        return ScopeCurrentAgeCalculationResponse(
            can_edit=True,
            calculated_moment_utc=calculated_moment_utc,
            created_count=0,
            updated_count=0,
            unchanged_count=0,
            item_list=[],
        )

    event_id_list = [row.id for row in event_row_list]
    relevant_field_id_list = list(
        {initial_field.id, final_field.id, current_field.id}
    )
    result_row_list = list(
        session.scalars(
            select(Result)
            .where(
                Result.event_id.in_(event_id_list),
                Result.field_id.in_(relevant_field_id_list),
            )
            .order_by(Result.event_id.asc(), Result.id.asc())
        )
    )

    initial_age_by_event_id: dict[int, int] = {}
    final_age_by_event_id: dict[int, int] = {}
    current_result_by_event_id: dict[int, Result] = {}

    for row in result_row_list:
        if row.field_id == initial_field.id and row.event_id not in initial_age_by_event_id:
            normalized_age = _normalize_whole_age_or_400(
                row.numeric_value,
                event_id=row.event_id,
                age_role="initial",
            )
            if normalized_age is not None:
                initial_age_by_event_id[row.event_id] = normalized_age
            if current_field.id == row.field_id and row.event_id not in current_result_by_event_id:
                current_result_by_event_id[row.event_id] = row
            continue

        if row.field_id == final_field.id and row.event_id not in final_age_by_event_id:
            normalized_age = _normalize_whole_age_or_400(
                row.numeric_value,
                event_id=row.event_id,
                age_role="final",
            )
            if normalized_age is not None:
                final_age_by_event_id[row.event_id] = normalized_age
            if current_field.id == row.field_id and row.event_id not in current_result_by_event_id:
                current_result_by_event_id[row.event_id] = row
            continue

        if row.field_id == current_field.id and row.event_id not in current_result_by_event_id:
            current_result_by_event_id[row.event_id] = row

    event_row_by_id = {row.id: row for row in event_row_list}
    event_row_list_by_group: defaultdict[tuple[int, int], list[Event]] = defaultdict(list)
    for row in event_row_list:
        event_row_list_by_group[(row.location_id, row.item_id)].append(row)

    assignment_meta_by_event_id: dict[int, dict[str, int]] = {}

    for group_event_row_list in event_row_list_by_group.values():
        active_initial_event: Event | None = None
        active_initial_age: int | None = None

        for row in group_event_row_list:
            next_initial_age = initial_age_by_event_id.get(row.id)
            if next_initial_age is not None:
                active_initial_event = row
                active_initial_age = next_initial_age

            final_age = final_age_by_event_id.get(row.id)
            if (
                active_initial_event is None
                or active_initial_age is None
                or final_age is None
            ):
                continue

            initial_day = active_initial_event.moment_utc.date()
            final_day = row.moment_utc.date()
            day_span = (final_day - initial_day).days
            expected_final_age = active_initial_age + day_span
            if final_age != expected_final_age:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Initial and final age values do not match the day span "
                        f"between events {active_initial_event.id} and {row.id}"
                    ),
                )

            for candidate in group_event_row_list:
                candidate_day = candidate.moment_utc.date()
                if candidate_day < initial_day or candidate_day > final_day:
                    continue

                numeric_value = active_initial_age + (candidate_day - initial_day).days
                previous_assignment = assignment_meta_by_event_id.get(candidate.id)
                if previous_assignment is not None and previous_assignment["numeric_value"] != numeric_value:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Overlapping current age ranges assign different values to event {candidate.id}"
                        ),
                    )

                assignment_meta_by_event_id[candidate.id] = {
                    "numeric_value": numeric_value,
                    "source_initial_event_id": active_initial_event.id,
                    "source_initial_age": active_initial_age,
                    "source_final_event_id": row.id,
                    "source_final_age": final_age,
                }

            active_initial_event = None
            active_initial_age = None

    if not assignment_meta_by_event_id:
        return ScopeCurrentAgeCalculationResponse(
            can_edit=True,
            calculated_moment_utc=calculated_moment_utc,
            created_count=0,
            updated_count=0,
            unchanged_count=0,
            item_list=[],
        )

    created_count = 0
    updated_count = 0
    unchanged_count = 0
    status_by_event_id: dict[int, Literal["created", "updated", "unchanged"]] = {}

    for row in event_row_list:
        assignment_meta = assignment_meta_by_event_id.get(row.id)
        if assignment_meta is None:
            continue

        target_numeric_value = Decimal(assignment_meta["numeric_value"])
        current_result = current_result_by_event_id.get(row.id)
        if current_result is None:
            current_result = Result(
                event_id=row.id,
                field_id=current_field.id,
                text_value=None,
                boolean_value=None,
                numeric_value=target_numeric_value,
                moment_utc=calculated_moment_utc,
            )
            session.add(current_result)
            current_result_by_event_id[row.id] = current_result
            status_by_event_id[row.id] = "created"
            created_count += 1
            continue

        should_update = (
            current_result.numeric_value != target_numeric_value
            or current_result.text_value is not None
            or current_result.boolean_value is not None
        )
        if should_update:
            current_result.numeric_value = target_numeric_value
            current_result.text_value = None
            current_result.boolean_value = None
            current_result.moment_utc = calculated_moment_utc
            session.add(current_result)
            status_by_event_id[row.id] = "updated"
            updated_count += 1
            continue

        status_by_event_id[row.id] = "unchanged"
        unchanged_count += 1

    if created_count > 0 or updated_count > 0:
        _apply_member_audit_context(session, member)
        commit_session_with_null_if_empty(session)

    item_list: list[ScopeCurrentAgeCalculationRecord] = []
    for event_id in event_id_list:
        assignment_meta = assignment_meta_by_event_id.get(event_id)
        if assignment_meta is None:
            continue
        event_row = event_row_by_id[event_id]
        current_result = current_result_by_event_id[event_id]
        item_list.append(
            ScopeCurrentAgeCalculationRecord(
                event_id=event_row.id,
                result_id=current_result.id,
                field_id=current_field.id,
                location_id=event_row.location_id,
                item_id=event_row.item_id,
                action_id=event_row.action_id,
                event_moment_utc=event_row.moment_utc,
                numeric_value=assignment_meta["numeric_value"],
                source_initial_event_id=assignment_meta["source_initial_event_id"],
                source_initial_age=assignment_meta["source_initial_age"],
                source_final_event_id=assignment_meta["source_final_event_id"],
                source_final_age=assignment_meta["source_final_age"],
                status=status_by_event_id[event_id],
            )
        )

    return ScopeCurrentAgeCalculationResponse(
        can_edit=True,
        calculated_moment_utc=calculated_moment_utc,
        created_count=created_count,
        updated_count=updated_count,
        unchanged_count=unchanged_count,
        item_list=item_list,
    )


# --- input ---


class ScopeInputRecord(BaseModel):
    id: int
    event_id: int
    field_id: int
    value: str


class ScopeInputListResponse(BaseModel):
    can_edit: bool
    item_list: list[ScopeInputRecord]


class ScopeInputCreateRequest(BaseModel):
    field_id: int
    value: str = PydanticField(min_length=1, max_length=65535)


class ScopeInputPatchRequest(BaseModel):
    value: str | None = PydanticField(default=None, min_length=1, max_length=65535)


@router.get(
    "/scopes/{scope_id}/events/{event_id}/inputs",
    response_model=ScopeInputListResponse,
)
def list_scope_event_inputs(
    scope_id: int,
    event_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    rows = list(
        session.scalars(
            select(Input).where(Input.event_id == event_id).order_by(Input.id)
        )
    )
    return ScopeInputListResponse(
        can_edit=_member_can_edit_scope_rules(member),
        item_list=[
            ScopeInputRecord(
                id=r.id, event_id=r.event_id, field_id=r.field_id, value=r.value
            )
            for r in rows
        ],
    )


@router.post(
    "/scopes/{scope_id}/events/{event_id}/inputs",
    response_model=ScopeInputListResponse,
)
def create_scope_event_input(
    scope_id: int,
    event_id: int,
    body: ScopeInputCreateRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    _field_in_scope_or_404(session, scope_id=scope_id, field_id=body.field_id)
    row = Input(
        event_id=event_id,
        field_id=body.field_id,
        value=body.value.strip(),
    )
    session.add(row)
    _apply_member_audit_context(session, member)
    try:
        commit_session_with_null_if_empty(session)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate input for this event and field",
        ) from exc
    return list_scope_event_inputs(scope_id, event_id, member, session)


@router.patch(
    "/scopes/{scope_id}/events/{event_id}/inputs/{input_id}",
    response_model=ScopeInputListResponse,
)
def patch_scope_event_input(
    scope_id: int,
    event_id: int,
    input_id: int,
    body: ScopeInputPatchRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    row = _input_in_event_or_404(session, event_id=event_id, input_id=input_id)
    if body.value is not None:
        row.value = body.value.strip()
    session.add(row)
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_event_inputs(scope_id, event_id, member, session)


@router.delete(
    "/scopes/{scope_id}/events/{event_id}/inputs/{input_id}",
    response_model=ScopeInputListResponse,
)
def delete_scope_event_input(
    scope_id: int,
    event_id: int,
    input_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    row = _input_in_event_or_404(session, event_id=event_id, input_id=input_id)
    session.delete(row)
    _apply_member_audit_context(session, member)
    session.commit()
    return list_scope_event_inputs(scope_id, event_id, member, session)


# --- result ---


class ScopeResultRecord(BaseModel):
    id: int
    event_id: int
    field_id: int
    text_value: str | None
    boolean_value: bool | None
    numeric_value: Decimal | None
    moment_utc: datetime


class ScopeResultListResponse(BaseModel):
    can_edit: bool
    item_list: list[ScopeResultRecord]


class ScopeResultCreateRequest(BaseModel):
    field_id: int
    text_value: str | None = PydanticField(default=None, max_length=65535)
    boolean_value: bool | None = None
    numeric_value: Decimal | None = None
    moment_utc: datetime | None = None


class ScopeResultPatchRequest(BaseModel):
    text_value: str | None = PydanticField(default=None, max_length=65535)
    boolean_value: bool | None = None
    numeric_value: Decimal | None = None
    moment_utc: datetime | None = None


@router.get(
    "/scopes/{scope_id}/events/{event_id}/results",
    response_model=ScopeResultListResponse,
)
def list_scope_event_results(
    scope_id: int,
    event_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    rows = list(
        session.scalars(
            select(Result).where(Result.event_id == event_id).order_by(Result.id)
        )
    )
    return ScopeResultListResponse(
        can_edit=_member_can_edit_scope_rules(member),
        item_list=[
            ScopeResultRecord(
                id=r.id,
                event_id=r.event_id,
                field_id=r.field_id,
                text_value=r.text_value,
                boolean_value=r.boolean_value,
                numeric_value=r.numeric_value,
                moment_utc=r.moment_utc,
            )
            for r in rows
        ],
    )


@router.post(
    "/scopes/{scope_id}/events/{event_id}/results",
    response_model=ScopeResultListResponse,
)
def create_scope_event_result(
    scope_id: int,
    event_id: int,
    body: ScopeResultCreateRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    _field_in_scope_or_404(session, scope_id=scope_id, field_id=body.field_id)
    moment = body.moment_utc or datetime.now(UTC)
    if moment.tzinfo is not None:
        moment = moment.astimezone(UTC).replace(tzinfo=None)
    row = Result(
        event_id=event_id,
        field_id=body.field_id,
        text_value=_normalize_optional_result_text(body.text_value),
        boolean_value=body.boolean_value,
        numeric_value=body.numeric_value,
        moment_utc=moment,
    )
    session.add(row)
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_event_results(scope_id, event_id, member, session)


@router.patch(
    "/scopes/{scope_id}/events/{event_id}/results/{result_id}",
    response_model=ScopeResultListResponse,
)
def patch_scope_event_result(
    scope_id: int,
    event_id: int,
    result_id: int,
    body: ScopeResultPatchRequest,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    row = _result_in_event_or_404(session, event_id=event_id, result_id=result_id)
    if "text_value" in body.model_fields_set:
        row.text_value = _normalize_optional_result_text(body.text_value)
    if "boolean_value" in body.model_fields_set:
        row.boolean_value = body.boolean_value
    if "numeric_value" in body.model_fields_set:
        row.numeric_value = body.numeric_value
    if body.moment_utc is not None:
        m = body.moment_utc
        if m.tzinfo is not None:
            m = m.astimezone(UTC).replace(tzinfo=None)
        row.moment_utc = m
    session.add(row)
    _apply_member_audit_context(session, member)
    commit_session_with_null_if_empty(session)
    return list_scope_event_results(scope_id, event_id, member, session)


@router.delete(
    "/scopes/{scope_id}/events/{event_id}/results/{result_id}",
    response_model=ScopeResultListResponse,
)
def delete_scope_event_result(
    scope_id: int,
    event_id: int,
    result_id: int,
    member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
):
    _require_scope_rules_editor(member)
    _event_in_scope_or_404(session, scope_id=scope_id, event_id=event_id)
    row = _result_in_event_or_404(session, event_id=event_id, result_id=result_id)
    session.delete(row)
    _apply_member_audit_context(session, member)
    session.commit()
    return list_scope_event_results(scope_id, event_id, member, session)
