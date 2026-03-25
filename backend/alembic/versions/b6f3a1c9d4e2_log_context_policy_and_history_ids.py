"""log: politica de contexto por tabela e remocao de FKs historicas

Revision ID: b6f3a1c9d4e2
Revises: a9f8e7d6c5b4
Create Date: 2026-03-25

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b6f3a1c9d4e2"
down_revision: Union[str, Sequence[str], None] = "a9f8e7d6c5b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STRICT_AUDIT_FUNCTION_DDL = r"""
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

_LEGACY_AUDIT_FUNCTION_DDL = r"""
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

  INSERT INTO log (account_id, tenant_id, table_name, action_type, "row")
  VALUES (v_account_id, v_tenant_id, TG_TABLE_NAME, v_action, v_row);

  RETURN COALESCE(NEW, OLD);
END;
$fn$;
"""


def _drop_fk_on_column(table: str, column: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for fk in inspector.get_foreign_keys(table):
        if fk["constrained_columns"] == [column]:
            op.drop_constraint(fk["name"], table, type_="foreignkey")
            return


def upgrade() -> None:
    op.execute(_STRICT_AUDIT_FUNCTION_DDL)
    _drop_fk_on_column("log", "tenant_id")
    _drop_fk_on_column("log", "account_id")
    op.alter_column(
        "log",
        "account_id",
        existing_type=sa.BigInteger(),
        existing_nullable=True,
        comment=(
            "Identificador da conta que originou o evento, preservado no historico "
            "mesmo apos exclusao da conta."
        ),
    )
    op.alter_column(
        "log",
        "tenant_id",
        existing_type=sa.BigInteger(),
        existing_nullable=True,
        comment=(
            "Identificador do licenciado relacionado ao evento, preservado no "
            "historico mesmo apos exclusao do licenciado."
        ),
    )


def downgrade() -> None:
    """Downgrade schema.

    Pode falhar ao recriar as FKs se existirem IDs historicos sem linha correspondente.
    """
    op.execute(_LEGACY_AUDIT_FUNCTION_DDL)
    op.alter_column(
        "log",
        "account_id",
        existing_type=sa.BigInteger(),
        existing_nullable=True,
        comment="Conta do usuario que originou o evento. NULL apos exclusao da conta.",
    )
    op.alter_column(
        "log",
        "tenant_id",
        existing_type=sa.BigInteger(),
        existing_nullable=True,
        comment="Licenciado ao qual o evento se refere. NULL apos exclusao do licenciado.",
    )
    op.create_foreign_key(
        "log_tenant_id_fkey",
        "log",
        "tenant",
        ["tenant_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "log_account_id_fkey",
        "log",
        "account",
        ["account_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="SET NULL",
    )
