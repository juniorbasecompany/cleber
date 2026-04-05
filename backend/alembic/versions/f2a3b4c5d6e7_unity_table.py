"""Tabela unity (unidade alocada); auditoria e log

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-04-05

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_LOG_WITH_UNITY = (
    "'account', 'action', 'event', 'field', 'formula', 'input', 'kind', 'label', "
    "'location', 'member', 'result', 'scope', 'tenant', 'item', 'unity'"
)

_LOG_WITHOUT_UNITY = (
    "'account', 'action', 'event', 'field', 'formula', 'input', 'kind', 'label', "
    "'location', 'member', 'result', 'scope', 'tenant', 'item'"
)

_AUDIT_WITH_UNITY_DDL = r"""
CREATE OR REPLACE FUNCTION valora_audit_row_to_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_tenant_id bigint;
  v_account_id bigint;
  v_row jsonb;
  v_action text;
  v_row_id bigint;
  v_raw text;
  v_tenant_required boolean := false;
  v_account_required boolean := false;
BEGIN
  BEGIN
    v_raw := current_setting('valora.current_tenant_id', true);
    IF v_raw IS NULL OR btrim(v_raw) = '' THEN
      v_tenant_id := NULL;
    ELSE
      v_tenant_id := v_raw::bigint;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_tenant_id := NULL;
  END;

  BEGIN
    v_raw := current_setting('valora.current_account_id', true);
    IF v_raw IS NULL OR btrim(v_raw) = '' THEN
      v_account_id := NULL;
    ELSE
      v_account_id := v_raw::bigint;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_account_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_action := 'D';
    v_row := NULL;
    v_row_id := OLD.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'U';
    v_row := row_to_json(NEW)::jsonb;
    v_row_id := NEW.id;
  ELSE
    v_action := 'I';
    v_row := row_to_json(NEW)::jsonb;
    v_row_id := NEW.id;
  END IF;

  IF TG_TABLE_NAME IN (
    'member', 'scope', 'location', 'item', 'kind', 'unity',
    'field', 'action', 'formula', 'label', 'event', 'input', 'result'
  ) THEN
    v_tenant_required := true;
    v_account_required := true;
  ELSIF TG_TABLE_NAME = 'tenant' THEN
    v_tenant_required := TG_OP <> 'INSERT';
    v_account_required := true;
  ELSIF TG_TABLE_NAME = 'account' THEN
    v_tenant_required := false;
    v_account_required := TG_OP <> 'INSERT';
  ELSE
    RAISE EXCEPTION 'Audit policy missing for table %', TG_TABLE_NAME
      USING ERRCODE = '23514';
  END IF;

  IF v_tenant_required AND v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Audit context missing tenant_id for table %, action %',
      TG_TABLE_NAME, TG_OP
      USING ERRCODE = '23514';
  END IF;

  IF v_account_required AND v_account_id IS NULL THEN
    RAISE EXCEPTION 'Audit context missing account_id for table %, action %',
      TG_TABLE_NAME, TG_OP
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO log (account_id, tenant_id, table_name, action_type, row_id, "row")
  VALUES (v_account_id, v_tenant_id, TG_TABLE_NAME, v_action, v_row_id, v_row);

  RETURN COALESCE(NEW, OLD);
END;
$fn$;
"""

_AUDIT_WITHOUT_UNITY_DDL = r"""
CREATE OR REPLACE FUNCTION valora_audit_row_to_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_tenant_id bigint;
  v_account_id bigint;
  v_row jsonb;
  v_action text;
  v_row_id bigint;
  v_raw text;
  v_tenant_required boolean := false;
  v_account_required boolean := false;
BEGIN
  BEGIN
    v_raw := current_setting('valora.current_tenant_id', true);
    IF v_raw IS NULL OR btrim(v_raw) = '' THEN
      v_tenant_id := NULL;
    ELSE
      v_tenant_id := v_raw::bigint;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_tenant_id := NULL;
  END;

  BEGIN
    v_raw := current_setting('valora.current_account_id', true);
    IF v_raw IS NULL OR btrim(v_raw) = '' THEN
      v_account_id := NULL;
    ELSE
      v_account_id := v_raw::bigint;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_account_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_action := 'D';
    v_row := NULL;
    v_row_id := OLD.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'U';
    v_row := row_to_json(NEW)::jsonb;
    v_row_id := NEW.id;
  ELSE
    v_action := 'I';
    v_row := row_to_json(NEW)::jsonb;
    v_row_id := NEW.id;
  END IF;

  IF TG_TABLE_NAME IN (
    'member', 'scope', 'location', 'item', 'kind',
    'field', 'action', 'formula', 'label', 'event', 'input', 'result'
  ) THEN
    v_tenant_required := true;
    v_account_required := true;
  ELSIF TG_TABLE_NAME = 'tenant' THEN
    v_tenant_required := TG_OP <> 'INSERT';
    v_account_required := true;
  ELSIF TG_TABLE_NAME = 'account' THEN
    v_tenant_required := false;
    v_account_required := TG_OP <> 'INSERT';
  ELSE
    RAISE EXCEPTION 'Audit policy missing for table %', TG_TABLE_NAME
      USING ERRCODE = '23514';
  END IF;

  IF v_tenant_required AND v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Audit context missing tenant_id for table %, action %',
      TG_TABLE_NAME, TG_OP
      USING ERRCODE = '23514';
  END IF;

  IF v_account_required AND v_account_id IS NULL THEN
    RAISE EXCEPTION 'Audit context missing account_id for table %, action %',
      TG_TABLE_NAME, TG_OP
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO log (account_id, tenant_id, table_name, action_type, row_id, "row")
  VALUES (v_account_id, v_tenant_id, TG_TABLE_NAME, v_action, v_row_id, v_row);

  RETURN COALESCE(NEW, OLD);
END;
$fn$;
"""


def upgrade() -> None:
    op.create_table(
        "unity",
        sa.Column(
            "id",
            sa.BigInteger(),
            autoincrement=True,
            nullable=False,
            comment="Identificador da unidade.",
        ),
        sa.Column(
            "location_id",
            sa.BigInteger(),
            sa.ForeignKey("location.id", onupdate="CASCADE", ondelete="RESTRICT"),
            nullable=False,
            comment="Localização da unidade.",
        ),
        sa.Column(
            "kind_id_list",
            postgresql.ARRAY(sa.BigInteger()),
            nullable=False,
            comment="Lista de IDs de tipos de item.",
        ),
        sa.Column(
            "creation_utc",
            sa.DateTime(timezone=False),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
            comment="Momento de criação da unidade.",
        ),
        sa.Column(
            "initial_age",
            sa.Integer(),
            nullable=False,
            comment="Idade inicial.",
        ),
        sa.Column(
            "final_age",
            sa.Integer(),
            nullable=False,
            comment="Idade final.",
        ),
        sa.CheckConstraint(
            "initial_age <= final_age",
            name="unity_age_range_chk",
        ),
        sa.PrimaryKeyConstraint("id"),
        comment="Unidade alocada (lote).",
    )
    op.create_index(
        "unity_location_id_idx",
        "unity",
        ["location_id"],
        unique=False,
    )

    op.drop_constraint("log_table_name_chk", "log", type_="check")
    op.create_check_constraint(
        "log_table_name_chk",
        "log",
        f"table_name IN ({_LOG_WITH_UNITY})",
    )

    op.execute(_AUDIT_WITH_UNITY_DDL)
    op.execute(
        """
        CREATE TRIGGER unity_valora_audit_trg
        AFTER INSERT OR UPDATE OR DELETE ON unity
        FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS unity_valora_audit_trg ON unity;")
    op.execute(_AUDIT_WITHOUT_UNITY_DDL)

    op.drop_constraint("log_table_name_chk", "log", type_="check")
    op.create_check_constraint(
        "log_table_name_chk",
        "log",
        f"table_name IN ({_LOG_WITHOUT_UNITY})",
    )

    op.drop_index("unity_location_id_idx", table_name="unity")
    op.drop_table("unity")
