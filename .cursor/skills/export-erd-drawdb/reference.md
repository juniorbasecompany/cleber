# Formato JSON do drawDB para diagrama ERD

Referência baseada no código-fonte do [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb) e na [documentação](https://drawdb-io.github.io/docs/). O diagrama é armazenado e exportado como JSON; ao importar, o drawDB reconstrói tabelas e relacionamentos.

## Raiz do documento

| Campo           | Obrigatório | Tipo   | Descrição |
|----------------|-------------|--------|-----------|
| `tables`       | sim         | array  | Lista de tabelas. |
| `relationships`| sim         | array  | Lista de relacionamentos (FK). |
| `notes`        | sim         | array  | Notas no canvas (pode ser `[]`). |
| `subjectAreas` | sim        | array  | Áreas/agrupamentos visuais (pode ser `[]`). |
| `title`        | não         | string | Título do diagrama. |
| `database`     | não         | string | Ex.: `"postgresql"`, `"generic"`. |
| `types`        | não         | array  | Tipos customizados (ex.: PostgreSQL). |
| `enums`        | não         | array  | Enums (ex.: PostgreSQL). |

## Tabela (`tables[]`)

| Campo     | Obrigatório | Tipo   | Descrição |
|----------|-------------|--------|-----------|
| `id`     | sim         | string | Identificador único (ex.: nanoid). |
| `name`   | sim         | string | Nome da tabela (ex.: `core.package` ou `package`). |
| `x`      | sim         | number | Posição X no canvas. |
| `y`      | sim         | number | Posição Y no canvas. |
| `fields` | sim         | array  | Colunas (ver Field). |
| `comment`| sim         | string | Comentário da tabela. |
| `indices`| sim         | array  | Índices (name, unique, fields). |
| `color`  | sim         | string | Cor em hex (ex.: `"#175e7a"`). |
| `locked` | não         | boolean| Tabela bloqueada. |
| `hidden` | não         | boolean| Ocultar no canvas. |

## Campo / Coluna (`tables[].fields[]`)

| Campo      | Obrigatório | Tipo    | Descrição |
|-----------|-------------|---------|-----------|
| `id`      | sim         | string  | Identificador único do campo. |
| `name`    | sim         | string  | Nome da coluna. |
| `type`    | sim         | string  | Tipo (ex.: `INT`, `BIGINT`, `TEXT`, `TIMESTAMPTZ`, `DATE`, `NUMERIC`). |
| `default` | sim         | string/number/boolean | Valor default (vazio `""` se não houver). |
| `check`   | sim         | string  | Check constraint (texto livre). |
| `primary` | sim         | boolean | Faz parte da PK. |
| `unique`  | sim         | boolean | Único. |
| `notNull` | sim         | boolean | NOT NULL. |
| `increment`| sim        | boolean | Autoincrement / GENERATED/IDENTITY. |
| `comment` | sim         | string  | Comentário da coluna. |
| `size`    | não         | string/number | Tamanho (ex. precisão). |
| `values`  | não         | array   | Valores (ex. enum). |

## Relacionamento (`relationships[]`)

| Campo              | Obrigatório | Tipo   | Descrição |
|-------------------|-------------|--------|-----------|
| `id`              | sim         | string | Identificador único. |
| `name`            | sim         | string | Nome da FK (ex.: `fk_tabela_coluna_referencia`). |
| `startTableId`    | sim         | string | id da tabela que contém a FK. |
| `startFieldId`    | sim         | string | id do campo FK. |
| `endTableId`      | sim         | string | id da tabela referenciada. |
| `endFieldId`      | sim         | string | id do campo PK referenciado. |
| `cardinality`     | sim         | string | `"one_to_one"`, `"one_to_many"`, `"many_to_one"`. |
| `updateConstraint`| sim         | string | `"No action"`, `"Restrict"`, `"Cascade"`, `"Set null"`, `"Set default"`. |
| `deleteConstraint`| sim         | string | Mesmos valores que updateConstraint. |

Regra: a coluna de origem (`start`) referencia a coluna de destino (`end`). Normalmente `end` é PK; `start` é a coluna FK.

## Índice (`tables[].indices[]`)

| Campo   | Obrigatório | Tipo    | Descrição |
|--------|-------------|---------|-----------|
| `name`  | sim         | string  | Nome do índice. |
| `unique`| sim         | boolean | Índice único. |
| `fields`| sim         | array   | Lista de nomes de colunas. |

## Nota (`notes[]`)

| Campo   | Obrigatório | Tipo    |
|--------|-------------|---------|
| id     | sim         | integer |
| x, y   | sim         | number  |
| title  | sim         | string  |
| content| sim         | string  |
| color  | sim         | string (hex) |
| height | sim         | number  |
| locked | não         | boolean |

## Área / Subject area (`subjectAreas[]`)

| Campo   | Obrigatório | Tipo    |
|--------|-------------|---------|
| id     | sim         | integer |
| name   | sim         | string  |
| x, y   | sim         | number  |
| width  | sim         | number  |
| height | sim         | number  |
| color  | sim         | string (hex) |
| locked | não         | boolean |

## Mapeamento PostgreSQL → drawDB (tipos)

Exemplos: `bigint` → `BIGINT`, `text` → `TEXT`, `timestamptz` → `TIMESTAMPTZ`, `date` → `DATE`, `boolean` → `BOOLEAN`, `numeric(18,6)` → `NUMERIC`, `jsonb` → `JSONB`, `char(2)` → `CHAR`.

## Links oficiais

- [drawDB](https://www.drawdb.app/)
- [drawDB Docs](https://drawdb-io.github.io/docs/)
- [drawDB Editor (import/export)](https://www.drawdb.app/editor)
- [drawDB GitHub](https://github.com/drawdb-io/drawdb)
