"""log.row_id NOT NULL; trigger preenche id da linha monitorizada

Revision ID: d4c8b2a0e1f3
Revises: b6f3a1c9d4e2
Create Date: 2026-03-26

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4c8b2a0e1f3"
down_revision: Union[str, Sequence[str], None] = "b6f3a1c9d4e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STRICT_AUDIT_WITH_ROW_ID_DDL = r"""
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

  IF TG_TABLE_NAME IN ('member', 'scope', 'location', 'unity') THEN
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

_STRICT_AUDIT_WITHOUT_ROW_ID_DDL = r"""
CREATE OR REPLACE FUNCTION valora_audit_row_to_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_tenant_id bigint;
  v_account_id bigint;
  v_row jsonb;
  v_action text;
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
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'U';
    v_row := row_to_json(NEW)::jsonb;
  ELSE
    v_action := 'I';
    v_row := row_to_json(NEW)::jsonb;
  END IF;

  IF TG_TABLE_NAME IN ('member', 'scope', 'location', 'unity') THEN
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

  INSERT INTO log (account_id, tenant_id, table_name, action_type, "row")
  VALUES (v_account_id, v_tenant_id, TG_TABLE_NAME, v_action, v_row);

  RETURN COALESCE(NEW, OLD);
END;
$fn$;
"""


def upgrade() -> None:
    """Coluna nullable primeiro, depois função (INSERT passa a preencher), depois NOT NULL."""
    op.add_column(
        "log",
        sa.Column(
            "row_id",
            sa.BigInteger(),
            nullable=True,
            comment="Identificador da linha na tabela referida por table_name.",
        ),
    )
    op.execute(_STRICT_AUDIT_WITH_ROW_ID_DDL)
    op.alter_column(
        "log",
        "row_id",
        existing_type=sa.BigInteger(),
        nullable=False,
        comment="Identificador da linha na tabela referida por table_name.",
    )


def downgrade() -> None:
    """Remover coluna antes da função antiga: INSERT sem row_id exigiria default se a coluna existisse."""
    op.drop_column("log", "row_id")
    op.execute(_STRICT_AUDIT_WITHOUT_ROW_ID_DDL)
