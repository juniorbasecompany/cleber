"""Ajusta erd_drawdb.json: uma cor por schema."""
import json
from pathlib import Path

ERD_PATH = Path(__file__).resolve().parent / "erd_drawdb.json"

# Uma cor distinta por schema (hex)
SCHEMA_COLORS = {
    "core": "#1a6b8a",
    "meta": "#7c4d7e",
    "fact": "#c45c26",
}


def main():
    with open(ERD_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for table in data.get("tables", []):
        name = table.get("name", "")
        if "." in name:
            schema = name.split(".", 1)[0]
            table["color"] = SCHEMA_COLORS.get(schema, "#6b7280")

    with open(ERD_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Cores por schema aplicadas:", SCHEMA_COLORS)


if __name__ == "__main__":
    main()
