#!/usr/bin/env python3
"""
Exporta o DDL PostgreSQL para o formato JSON do drawDB (ERD).
Uso: script_export_drawdb_erd.py [caminho_ddl] [caminho_saida_json]
Padrão: backend/sql/initial_schema.sql -> backend/sql/erd_drawdb.json
"""
from __future__ import annotations

import argparse
import json
import re
import uuid
from pathlib import Path


# Mapeamento tipo PostgreSQL -> drawDB (nome em maiúsculas)
PG_TYPE_MAP = {
    "bigint": "BIGINT",
    "int": "INT",
    "integer": "INTEGER",
    "smallint": "SMALLINT",
    "text": "TEXT",
    "varchar": "VARCHAR",
    "char": "CHAR",
    "boolean": "BOOLEAN",
    "date": "DATE",
    "timestamptz": "TIMESTAMPTZ",
    "timestamp": "TIMESTAMP",
    "jsonb": "JSONB",
    "json": "JSON",
    "numeric": "NUMERIC",
}


def _normalize_type(raw: str) -> str:
    raw_lower = raw.strip().lower()
    base = re.match(r"(\w+)(?:\([^)]*\))?", raw_lower)
    if base:
        name = base.group(1)
        out = PG_TYPE_MAP.get(name, name.upper())
        if "(" in raw_lower:
            paren = raw[raw.find("(") :]
            return out + paren
        return out
    return raw.strip().upper()


def _short_id() -> str:
    return uuid.uuid4().hex[:12]


def _parse_table_blocks(content: str) -> list[tuple[str, str]]:
    """Retorna lista de (full_table_name, body) para cada CREATE TABLE."""
    pattern = re.compile(
        r"CREATE\s+TABLE\s+(core|meta|fact)\.(\w+)\s*\((.*?)\)\s*(?:PARTITION\s+BY|;)",
        re.DOTALL | re.IGNORECASE,
    )
    result = []
    for m in pattern.finditer(content):
        schema, table, body = m.group(1), m.group(2), m.group(3)
        full_name = f"{schema}.{table}"
        result.append((full_name, body.strip()))
    return result


def _tokenize_body(body: str) -> list[str]:
    """Divide o body por vírgula respeitando parênteses."""
    tokens = []
    depth = 0
    start = 0
    for i, c in enumerate(body):
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        elif c == "," and depth == 0:
            tokens.append(body[start:i].strip())
            start = i + 1
    if start < len(body):
        tokens.append(body[start:].strip())
    return tokens


def _parse_column_line(line: str) -> dict | None:
    """Extrai nome, tipo e flags de uma linha de coluna. Retorna None se for constraint."""
    if line.upper().startswith("CONSTRAINT"):
        return None
    # col_name type [NULL|NOT NULL] [DEFAULT ...] [GENERATED ...] [PRIMARY KEY]?
    m = re.match(
        r"(\w+)\s+(\w+(?:\([^)]*\))?)\s*(.*)$",
        line.strip(),
        re.DOTALL | re.IGNORECASE,
    )
    if not m:
        return None
    col_name, type_str, rest = m.group(1), m.group(2), m.group(3)
    rest_upper = rest.upper()
    not_null = "NOT NULL" in rest_upper
    default = ""
    default_m = re.search(r"DEFAULT\s+(.+?)(?:\s+CONSTRAINT|\s*$)", rest, re.DOTALL | re.IGNORECASE)
    if default_m:
        default = default_m.group(1).strip().rstrip(",")
    increment = "GENERATED" in rest_upper and "IDENTITY" in rest_upper
    primary = "PRIMARY KEY" in rest_upper
    return {
        "name": col_name,
        "type": _normalize_type(type_str),
        "notNull": not_null,
        "default": default,
        "increment": increment,
        "primary": primary,
    }


def _parse_fk_constraint(line: str) -> list[tuple[str, str, str]]:
    """FOREIGN KEY (c1, c2) REFERENCES ref_table (r1, r2) -> [(c1,r1,ref_table), (c2,r2,ref_table)]."""
    fk_m = re.search(
        r"FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+\.\w+)\s*\(([^)]+)\)",
        line,
        re.IGNORECASE,
    )
    if not fk_m:
        return []
    fk_cols = [c.strip() for c in fk_m.group(1).split(",")]
    ref_table = fk_m.group(2)
    ref_cols = [c.strip() for c in fk_m.group(3).split(",")]
    if len(fk_cols) != len(ref_cols):
        return []
    return [(fk_cols[i], ref_cols[i], ref_table) for i in range(len(fk_cols))]


def _parse_pk_constraint(line: str) -> list[str]:
    """PRIMARY KEY (c1, c2) -> [c1, c2]."""
    m = re.search(r"PRIMARY\s+KEY\s*\(([^)]+)\)", line, re.IGNORECASE)
    if not m:
        return []
    return [c.strip() for c in m.group(1).split(",")]


def parse_ddl(content: str) -> tuple[list[dict], list[dict]]:
    """Retorna (tables, relationships) no formato interno (com name refs)."""
    tables = []
    relationships = []
    table_name_to_id: dict[str, str] = {}
    table_col_to_field_id: dict[tuple[str, str], str] = {}

    for full_name, body in _parse_table_blocks(content):
        table_id = _short_id()
        table_name_to_id[full_name] = table_id
        tokens = _tokenize_body(body)
        columns_by_name: dict[str, dict] = {}
        pk_columns: set[str] = set()

        for token in tokens:
            if token.upper().startswith("CONSTRAINT"):
                fk_list = _parse_fk_constraint(token)
                for fk_col, ref_col, ref_table in fk_list:
                    relationships.append({
                        "start_table": full_name,
                        "start_col": fk_col,
                        "end_table": ref_table,
                        "end_col": ref_col,
                    })
                pk_list = _parse_pk_constraint(token)
                pk_columns.update(pk_list)
                continue
            col = _parse_column_line(token)
            if col:
                columns_by_name[col["name"]] = col
                if col.get("primary"):
                    pk_columns.add(col["name"])

        for c in pk_columns:
            if c in columns_by_name:
                columns_by_name[c]["primary"] = True

        field_list = []
        for col_name, col in columns_by_name.items():
            field_id = _short_id()
            table_col_to_field_id[(full_name, col_name)] = field_id
            field_list.append({
                "id": field_id,
                "name": col["name"],
                "type": col["type"],
                "default": col.get("default", ""),
                "check": "",
                "primary": col.get("primary", False),
                "unique": col.get("primary", False),
                "notNull": col.get("notNull", False),
                "increment": col.get("increment", False),
                "comment": "",
            })
        tables.append({
            "id": table_id,
            "name": full_name,
            "fields": field_list,
            "column_names": list(columns_by_name.keys()),
        })

    # Resolver relationships para usar ids
    rel_by_id = []
    for r in relationships:
        start_key = (r["start_table"], r["start_col"])
        end_key = (r["end_table"], r["end_col"])
        start_table_id = table_name_to_id.get(r["start_table"])
        end_table_id = table_name_to_id.get(r["end_table"])
        start_field_id = table_col_to_field_id.get(start_key)
        end_field_id = table_col_to_field_id.get(end_key)
        if not all([start_table_id, end_table_id, start_field_id, end_field_id]):
            continue
        rel_name = f"fk_{r['start_table']}_{r['start_col']}_{r['end_table']}"
        rel_by_id.append({
            "id": _short_id(),
            "name": rel_name,
            "startTableId": start_table_id,
            "startFieldId": start_field_id,
            "endTableId": end_table_id,
            "endFieldId": end_field_id,
            "cardinality": "many_to_one",
            "updateConstraint": "No action",
            "deleteConstraint": "No action",
        })
    return tables, rel_by_id


def build_drawdb_diagram(tables: list[dict], relationships: list[dict]) -> dict:
    """Monta o objeto completo do diagrama drawDB com posições x,y."""
    table_width = 220
    table_spacing = 280
    cols_per_row = 4
    default_color = "#175e7a"

    drawdb_tables = []
    for i, t in enumerate(tables):
        row, col = i // cols_per_row, i % cols_per_row
        x = 80 + col * (table_width + table_spacing)
        y = 80 + row * 320
        drawdb_tables.append({
            "id": t["id"],
            "name": t["name"],
            "x": float(x),
            "y": float(y),
            "fields": t["fields"],
            "comment": "",
            "indices": [],
            "color": default_color,
            "locked": False,
        })

    return {
        "tables": drawdb_tables,
        "relationships": relationships,
        "notes": [],
        "subjectAreas": [],
        "title": "Cleber ERD",
        "database": "postgresql",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export DDL to drawDB ERD JSON")
    parser.add_argument(
        "ddl_path",
        nargs="?",
        default=None,
        help="Caminho do arquivo DDL (default: backend/sql/initial_schema.sql)",
    )
    parser.add_argument(
        "out_path",
        nargs="?",
        default=None,
        help="Caminho do JSON de saída (default: backend/sql/erd_drawdb.json)",
    )
    args = parser.parse_args()
    # Repo root: script está em repo/.cursor/skills/export-erd-drawdb/scripts/
    root = Path(__file__).resolve().parents[4]
    if args.ddl_path:
        ddl_file = Path(args.ddl_path)
        if not ddl_file.is_absolute():
            ddl_file = root / ddl_file
    else:
        ddl_file = root / "backend" / "sql" / "initial_schema.sql"
    if args.out_path:
        out_file = Path(args.out_path)
        if not out_file.is_absolute():
            out_file = root / out_file
    else:
        out_file = root / "backend" / "sql" / "erd_drawdb.json"

    content = ddl_file.read_text(encoding="utf-8")
    tables, relationships = parse_ddl(content)
    diagram = build_drawdb_diagram(tables, relationships)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(diagram, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Escrito: {out_file} ({len(tables)} tabelas, {len(relationships)} relacionamentos)")


if __name__ == "__main__":
    main()
