---
name: export-erd-drawdb
description: Export the project data structure as an ERD in drawDB JSON format. Use when the user asks to export the schema to drawDB, generate ERD for drawdb.app, or create a diagram JSON compatible with https://www.drawdb.app/ and https://drawdb-io.github.io/docs/
---

# Exportar ERD no formato JSON do drawDB

## Objetivo

Permitir que a estrutura de dados do projeto (esquema PostgreSQL em `backend/sql/initial_schema.sql`) seja exportada como diagrama ERD no formato JSON aceito pelo [drawDB](https://www.drawdb.app/) para visualização e edição em https://www.drawdb.app/editor.

## Quando usar

- Usuário pede para exportar o esquema/ERD para drawDB.
- Gerar diagrama visual da base a partir do DDL.
- Produzir JSON compatível com import do drawDB.

## Fluxo

1. **Fonte**: o esquema oficial está em `backend/sql/initial_schema.sql` (PostgreSQL).
2. **Script**: executar o script de exportação que lê o DDL e gera o JSON drawDB:
   ```bash
   python .cursor/skills/export-erd-drawdb/scripts/script_export_drawdb_erd.py
   ```
   Por padrão o script lê `backend/sql/initial_schema.sql` e grava `backend/sql/erd_drawdb.json`. Caminhos podem ser passados como argumentos.
3. **Importar no drawDB**: em https://www.drawdb.app/editor usar **File > Import** e escolher o arquivo JSON gerado.

## Formato JSON (resumo)

O drawDB espera um objeto com:

- `tables`: lista de tabelas (id, name, x, y, fields, comment, indices, color).
- `relationships`: lista de relacionamentos (startTableId, startFieldId, endTableId, endFieldId, cardinality, etc.).
- `notes`: array (pode ser `[]`).
- `subjectAreas`: array (pode ser `[]`).

Cada **field** em `tables[].fields` deve ter: `id`, `name`, `type`, `default`, `check`, `primary`, `unique`, `notNull`, `increment`, `comment`.  
Cada **relationship** deve ter: `id`, `name`, `startTableId`, `startFieldId`, `endTableId`, `endFieldId`, `cardinality`, `updateConstraint`, `deleteConstraint`.

Cardinalidade: `"one_to_one"`, `"one_to_many"`, `"many_to_one"`.  
Constraints de FK: `"No action"`, `"Restrict"`, `"Cascade"`, `"Set null"`, `"Set default"`.

## Referência completa

Para o esquema JSON completo (tipos, enums, áreas, notas), ver [reference.md](reference.md). Documentação oficial: [drawDB Docs](https://drawdb-io.github.io/docs/), [drawDB Editor](https://www.drawdb.app/editor).

## Manutenção

- Ao alterar `initial_schema.sql`, rodar novamente o script e reimportar o JSON no drawDB se quiser o diagrama atualizado.
- O script usa apenas biblioteca padrão Python; não é necessário `pip install` para uso básico.
