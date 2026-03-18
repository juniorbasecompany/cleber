"""
Normaliza IDs e atributos no ERD (erd.json).
Padrão: id da tabela = name; id da coluna = "tableName.fieldName";
ordem dos atributos da tabela: id, name, x, y, comment, indices, color, locked?, fields.
"""

import json
import re
from pathlib import Path

ERD_PATH = Path(__file__).resolve().parent / "erd.json"

# Hash: 12 caracteres hexadecimais
HASH_PATTERN = re.compile(r"^[a-f0-9]{12}$")


def is_hash(s: str) -> bool:
    return isinstance(s, str) and bool(HASH_PATTERN.match(s))


def is_table_field_id_format(table_name: str, field_id: str, field_name: str) -> bool:
    """Verifica se field_id já está no formato tableName.fieldName."""
    expected = f"{table_name}.{field_name}"
    return field_id == expected


def reorder_table_keys(tbl: dict) -> dict:
    """Reordena chaves do objeto tabela: id, name, x, y, comment, indices, color, locked?, fields."""
    order = ["id", "name", "x", "y", "comment", "indices", "color"]
    if "locked" in tbl:
        order.append("locked")
    order.append("fields")
    return {k: tbl[k] for k in order if k in tbl}


def main() -> None:
    with open(ERD_PATH, encoding="utf-8") as f:
        data = json.load(f)

    table_id_map = {}  # old table id -> new (name)
    field_id_map = {}  # old field id -> "tableName.fieldName"

    for tbl in data["tables"]:
        table_name = tbl["name"]
        old_table_id = tbl["id"]

        # 1. Id da tabela: se for hash, trocar por name
        if is_hash(old_table_id):
            tbl["id"] = table_name
        current_table_id = tbl["id"]
        table_id_map[old_table_id] = current_table_id

        # 2. Id de cada campo: hash ou fora do padrão -> "tableName.fieldName"
        for field in tbl.get("fields", []):
            old_field_id = field["id"]
            field_name = field["name"]
            new_field_id = f"{current_table_id}.{field_name}"
            if is_hash(old_field_id) or not is_table_field_id_format(
                current_table_id, old_field_id, field_name
            ):
                field["id"] = new_field_id
                field_id_map[old_field_id] = new_field_id
            else:
                field_id_map[old_field_id] = old_field_id

        # 3. Reordenar chaves do objeto tabela
        reordered = reorder_table_keys(tbl)
        tbl.clear()
        tbl.update(reordered)

    # 4. Atualizar relationships
    for rel in data.get("relationships", []):
        for key in ("startTableId", "endTableId"):
            if rel[key] in table_id_map:
                rel[key] = table_id_map[rel[key]]
        for key in ("startFieldId", "endFieldId"):
            if rel[key] in field_id_map:
                rel[key] = field_id_map[rel[key]]

    with open(ERD_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("erd.json normalizado com sucesso.")


if __name__ == "__main__":
    main()
