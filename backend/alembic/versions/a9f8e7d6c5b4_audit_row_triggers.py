"""Triggers de auditoria: INSERT em log em mutações nas tabelas monitorizadas.

Revision ID: a9f8e7d6c5b4
Revises: f1e2d3c4b5a6
Create Date: 2026-03-25

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a9f8e7d6c5b4"
down_revision: Union[str, Sequence[str], None] = "f1e2d3c4b5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_AUDIT_FUNCTION_DDL = r"""
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
  -- Contexto do ator e do tenant: definido na transação com SET LOCAL (via set_config).
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

_DROP_TRIGGERS = [
    "DROP TRIGGER IF EXISTS tenant_valora_audit_trg ON tenant;",
    "DROP TRIGGER IF EXISTS account_valora_audit_trg ON account;",
    "DROP TRIGGER IF EXISTS member_valora_audit_trg ON member;",
    "DROP TRIGGER IF EXISTS scope_valora_audit_trg ON scope;",
    "DROP TRIGGER IF EXISTS location_valora_audit_trg ON location;",
    "DROP TRIGGER IF EXISTS unity_valora_audit_trg ON unity;",
]

_CREATE_TRIGGERS = [
    """
    CREATE TRIGGER tenant_valora_audit_trg
    AFTER INSERT OR UPDATE OR DELETE ON tenant
    FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
    """,
    """
    CREATE TRIGGER account_valora_audit_trg
    AFTER INSERT OR UPDATE OR DELETE ON account
    FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
    """,
    """
    CREATE TRIGGER member_valora_audit_trg
    AFTER INSERT OR UPDATE OR DELETE ON member
    FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
    """,
    """
    CREATE TRIGGER scope_valora_audit_trg
    AFTER INSERT OR UPDATE OR DELETE ON scope
    FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
    """,
    """
    CREATE TRIGGER location_valora_audit_trg
    AFTER INSERT OR UPDATE OR DELETE ON location
    FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
    """,
    """
    CREATE TRIGGER unity_valora_audit_trg
    AFTER INSERT OR UPDATE OR DELETE ON unity
    FOR EACH ROW EXECUTE FUNCTION valora_audit_row_to_log();
    """,
]


def upgrade() -> None:
    op.execute(_AUDIT_FUNCTION_DDL)
    for stmt in _CREATE_TRIGGERS:
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _DROP_TRIGGERS:
        op.execute(stmt)
    op.execute("DROP FUNCTION IF EXISTS valora_audit_row_to_log();")
