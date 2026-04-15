# Plano: colunas `age` em `input` e `result` (ERD como decisão de produto)

## Situação

- O [`backend/erd.json`](backend/erd.json) declara **`age`** em `input` (nullable, INTEGER) e **`age`** em `result` (no desenho atual: INTEGER obrigatório entre `unity_id` e `event_id`).
- O código atual em [`backend/src/valora_backend/model/rules.py`](backend/src/valora_backend/model/rules.py) **não** persiste `age` em `input`; em **`result`** persiste **`moment_utc`** (e não `age`), com uso intenso em [`backend/src/valora_backend/api/rules.py`](backend/src/valora_backend/api/rules.py) (filtros por data, ordenação, recorrência, etc.).

**Decisão de produto:** o banco deve refletir o ERD quanto a **`age`**; isso implica **modelos + migração + API/negócio + testes**, não apenas editar o JSON.

---

## Decisão de produto (confirmada): `age` como referência principal em `result`

**Escolha:** migrar de **`moment_utc`** para **`age`** como eixo principal em `result` (refatoração maior na API), alinhado ao ERD que modela idade inteira, não timestamp no resultado.

**Implicações:**

- Remover (ou tornar legado e depois dropar) a coluna **`result.moment_utc`** após migração de dados e troca de toda a lógica que hoje filtra/ordena/agrupa por `Result.moment_utc` em [`backend/src/valora_backend/api/rules.py`](backend/src/valora_backend/api/rules.py) e pontos relacionados.
- Migração Alembic em fases típicas: (1) adicionar `result.age` com backfill a partir de `moment_utc` + regra de negócio (ex.: converter data em “dia de idade” no contexto do `unity`/escopo); (2) atualizar aplicação para ler/escrever só `age`; (3) dropar `moment_utc` de `result` quando não houver dependências.
- **Atenção:** `event` continua com **`event.moment_utc`** onde aplicável (fato vs padrão); só a entidade **`result`** deixa de carregar timestamp próprio se a decisão for só idade no resultado.

Risco: qualquer relatório, índice SQL ou contrato JSON que exponha `moment_utc` em resultados precisa de novo contrato (ex.: `age` ou data derivada na leitura).

---

## Como implementar (fluxo técnico)

### 1. Modelo e DDL

- Em **`Input`:** adicionar `age: Mapped[int | None]` (ou tipo alinhado ao ERD), `nullable=True`, com comentário em PT-BR igual à intenção do diagrama (eventos recorrentes × idade).
- Em **`Result`:** introduzir **`age`** como coluna principal; planejar remoção de **`moment_utc`** em `result` após backfill e refatoração (ver fases abaixo).
- Nova revisão Alembic: `op.add_column` para `age`; depois revisão(ões) para `drop_column` em `result.moment_utc` quando seguro; índices substituindo filtros que hoje usam `moment_utc` (ex.: por `age`, `event_id`, `unity_id`).

### 2. Migração de dados (`result`: `moment_utc` → `age`)

- Definir função única de **backfill**: para cada linha em `result`, calcular `age` a partir de `moment_utc` + vínculos (`unity_id`, `event_id`, escopo, campo de idade atual, etc.). Se algum caso for indeterminável, política explícita (falhar a migração, valor default, ou correção manual).
- Após backfill e deploy da API nova: `ALTER TABLE ... DROP COLUMN moment_utc` em `result` (revisão Alembic separada).

### 3. API e regras de negócio

- Endpoints que criam/atualizam **`Input`**: persistir `age` (nullable) conforme recorrência.
- **`Result`:** toda criação/atualização grava **`age`**; remover parâmetros/respostas que expunham `moment_utc` no resultado persistido; reimplementar intervalos, ordenação e “dia de execução” em termos de **`age`** (e, se necessário, `event.moment_utc` ou dados do evento/unidade para contexto temporal na camada de leitura).
- Varredura obrigatória: ocorrências de `Result.moment_utc` e esquemas Pydantic que carregam `moment_utc` de resultado em [`backend/src/valora_backend/api/rules.py`](backend/src/valora_backend/api/rules.py) (e testes).

### 4. Auditoria

- Tabelas `input` e `result` já costumam estar em triggers de auditoria; novas colunas entram no JSON da linha automaticamente. Confirmar lista em `log.table_name` se já estiver correta ([`log.py`](backend/src/valora_backend/model/log.py)). Seguir [`.cursor/skills/audit-log-triggers/SKILL.md`](.cursor/skills/audit-log-triggers/SKILL.md) se alguma migração alterar política de `log` ou nomes monitorizados.

### 5. Testes e ERD

- Atualizar [`backend/tests/test_erd_orm_consistency.py`](backend/tests/test_erd_orm_consistency.py) (ordem de colunas de `result` / campos novos).
- Testes de API e, se aplicável, [`tests/test_audit_triggers_pg.py`](backend/tests/test_audit_triggers_pg.py) com Postgres.

### 6. Diagrama

- Ajustar [`backend/erd.json`](backend/erd.json) para **`result`** sem **`moment_utc`** como coluna (apenas **`age`** e demais campos finais), coerente com o schema pós-migração.

---

## Resumo

| Etapa | Ação |
|--------|------|
| Decisão | **`age`** como referência em `result`; **`moment_utc`** removido de `result` após migração |
| ORM | `age` em `Input` e `Result`; remover `moment_utc` do modelo `Result` quando a coluna for dropada |
| Alembic | `add_column age` → backfill → `drop_column moment_utc` em `result`; constraints e índices novos |
| API | Refatorar fluxos que usam `Result.moment_utc` para `age` (alto impacto) |
| Testes | ORM/ERD, API, integração, auditoria |
| ERD | `result` sem coluna `moment_utc` se for o modelo final |

Este plano reflete a intenção: **ERD manda** em `age`; o código e o banco migram **para longe** de `moment_utc` em **`result`**, com trabalho concentrado na camada de regras e na migração de dados.
