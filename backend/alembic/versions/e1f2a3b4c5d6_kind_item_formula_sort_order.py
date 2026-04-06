"""kind table; item.kind_id; formula.step -> sort_order; audit kind

Revision ID: e1f2a3b4c5d6
Revises: c4e8d1f2a3b5
Create Date: 2026-04-05

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "c4e8d1f2a3b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_LOG_TABLE_NAMES = (
    "'account', 'action', 'event', 'field', 'formula', 'input', 'kind', 'label', "
    "'location', 'member', 'result', 'scope', 'tenant', 'item'"
)

_AUDIT_FUNCTION_WITH_RULES_DDL = r"""
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
        "kind",
        sa.Column(
            "id",
            sa.BigInteger(),
            autoincrement=True,
            nullable=False,
            comment="Identificador do tipo de item.",
        ),
        sa.Column(
            "scope_id",
            sa.BigInteger(),
            nullable=False,
            comment="Escopo a qual pertence este tipo de item.",
        ),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(
            ["scope_id"],
            ["scope.id"],
            name="kind_scope_id_fkey",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("scope_id", "name", name="kind_scope_name_unique"),
        sa.UniqueConstraint(
            "scope_id", "display_name", name="kind_scope_display_name_unique"
        ),
        comment="Tipos de itens por escopo (ex.: galinha, cobb, fêmea).",
    )

    op.execute(
        """
        DO $$
        DECLARE
            row_record RECORD;
            resolved_display_name TEXT;
            suffix_index INTEGER;
        BEGIN
            FOR row_record IN
                SELECT DISTINCT ON (scope_id, name)
                    scope_id, name, display_name, id
                FROM item
                ORDER BY scope_id, name, id
            LOOP
                resolved_display_name := row_record.display_name;
                suffix_index := 1;

                WHILE EXISTS (
                    SELECT 1
                    FROM kind
                    WHERE scope_id = row_record.scope_id
                      AND display_name = resolved_display_name
                ) LOOP
                    IF suffix_index = 1 THEN
                        resolved_display_name := row_record.display_name
                            || ' (' || row_record.name || ')';
                    ELSE
                        resolved_display_name := row_record.display_name
                            || ' (' || row_record.name || ' #'
                            || suffix_index::TEXT || ')';
                    END IF;
                    suffix_index := suffix_index + 1;
                END LOOP;

                INSERT INTO kind (scope_id, name, display_name)
                VALUES (
                    row_record.scope_id,
                    row_record.name,
                    resolved_display_name
                );
            END LOOP;
        END
        $$;
        """
    )

    op.execute("ALTER TABLE item DISABLE TRIGGER item_valora_audit_trg")

    op.add_column("item", sa.Column("kind_id", sa.BigInteger(), nullable=True))
    op.execute(
        """
        UPDATE item AS i
        SET kind_id = k.id
        FROM kind AS k
        WHERE k.scope_id = i.scope_id AND k.name = i.name
        """
    )
    op.alter_column("item", "kind_id", nullable=False)
    op.create_foreign_key(
        "item_kind_id_fkey",
        "item",
        "kind",
        ["kind_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="RESTRICT",
    )

    op.drop_index("item_scope_parent_name_idx", table_name="item")
    op.create_index(
        "item_scope_parent_kind_idx",
        "item",
        ["scope_id", "parent_item_id", "kind_id"],
        unique=False,
    )

    op.drop_column("item", "name")
    op.drop_column("item", "display_name")

    op.execute("ALTER TABLE item ENABLE TRIGGER item_valora_audit_trg")

    op.execute("ALTER TABLE formula DISABLE TRIGGER formula_valora_audit_trg")
    op.execute(
        "ALTER TABLE formula RENAME COLUMN step TO sort_order"
    )
    op.execute(
        "ALTER TABLE formula RENAME CONSTRAINT formula_action_step_unique "
        "TO formula_action_sort_order_unique"
    )
    op.execute("ALTER TABLE formula ENABLE TRIGGER formula_valora_audit_trg")

    op.drop_constraint("log_table_name_chk", "log", type_="check")
    op.create_check_constraint(
        "log_table_name_chk",
        "log",
        f"table_name IN ({_LOG_TABLE_NAMES})",
    )

    op.execute(_AUDIT_FUNCTION_WITH_RULES_DDL)

    op.execute(
        """
        CREATE TRIGGER kind_valora_audit_trg
        AFTER INSERT OR UPDATE OR DELETE ON kind
        FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS kind_valora_audit_trg ON kind")

    op.execute("ALTER TABLE formula DISABLE TRIGGER formula_valora_audit_trg")
    op.execute(
        "ALTER TABLE formula RENAME COLUMN sort_order TO step"
    )
    op.execute(
        "ALTER TABLE formula RENAME CONSTRAINT formula_action_sort_order_unique "
        "TO formula_action_step_unique"
    )
    op.execute("ALTER TABLE formula ENABLE TRIGGER formula_valora_audit_trg")

    op.execute("ALTER TABLE item DISABLE TRIGGER item_valora_audit_trg")

    op.add_column(
        "item",
        sa.Column("name", sa.Text(), nullable=True),
    )
    op.add_column(
        "item",
        sa.Column("display_name", sa.Text(), nullable=True),
    )
    op.execute(
        """
        UPDATE item AS i
        SET name = k.name, display_name = k.display_name
        FROM kind AS k
        WHERE i.kind_id = k.id
        """
    )
    op.alter_column("item", "name", nullable=False)
    op.alter_column("item", "display_name", nullable=False)

    op.drop_constraint("item_kind_id_fkey", "item", type_="foreignkey")
    op.drop_column("item", "kind_id")

    op.execute("ALTER TABLE item ENABLE TRIGGER item_valora_audit_trg")

    op.drop_index("item_scope_parent_kind_idx", table_name="item")
    op.create_index(
        "item_scope_parent_name_idx",
        "item",
        ["scope_id", "parent_item_id", "name"],
        unique=False,
    )

    op.drop_table("kind")

    _log_old = (
        "'account', 'action', 'event', 'field', 'formula', 'input', 'label', "
        "'location', 'member', 'result', 'scope', 'tenant', 'item'"
    )
    op.drop_constraint("log_table_name_chk", "log", type_="check")
    op.create_check_constraint(
        "log_table_name_chk",
        "log",
        f"table_name IN ({_log_old})",
    )

    op.execute(_AUDIT_FUNCTION_WITHOUT_KIND_DDL)


_AUDIT_FUNCTION_WITHOUT_KIND_DDL = r"""
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
    'member', 'scope', 'location', 'item',
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
