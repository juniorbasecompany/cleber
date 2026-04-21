# Plano: remover `input.age`

## Contexto

A coluna `input.age` foi introduzida na revisão Alembic [a3b4c5d6e7f8_input_age_result_age_drop_moment.py](../../backend/alembic/versions/a3b4c5d6e7f8_input_age_result_age_drop_moment.py) em conjunto com `result.age`, com a intenção de guardar "valor do parâmetro por idade" em eventos recorrentes. Na prática, o motor de cálculo nunca consumiu esse campo:

- `_calculate_scope_current_age` em [backend/src/valora_backend/api/rules.py](../../backend/src/valora_backend/api/rules.py) lê linhas de `Input` e indexa o runtime apenas por `field_id`, ignorando `age`.
- `_build_event_input_summary_map` também ignora `age`.
- Testes do motor (`test_formula_input_*`, `test_member_directory_api.py`) constroem `Input(event_id=..., field_id=..., value=...)` sem passar `age`.
- Frontend não lê o campo.

Resultado: a coluna era um artefato de contrato (aceita em `POST`/`PATCH` e devolvida no `GET`), sem qualquer efeito no comportamento. Este plano formaliza a remoção.

## Escopo

Este plano cobre **apenas a coluna `input.age`**. `result.age`, `event.age` e os três flags de idade em `field` (`is_initial_age`, `is_current_age`, `is_final_age`) permanecem inalterados.

## Checklist de implementação

- [x] Nova revisão Alembic [c3d5e7f9a1b4_input_drop_age.py](../../backend/alembic/versions/c3d5e7f9a1b4_input_drop_age.py) com `down_revision = "d1c2b3a4e5f6"`, fazendo `op.drop_column("input", "age")` no `upgrade()` e recriando a coluna como `nullable=True` (vazia) no `downgrade()`.
- [x] Remover o campo `age` em `class Input` em [backend/src/valora_backend/model/rules.py](../../backend/src/valora_backend/model/rules.py).
- [x] Remover `age` dos schemas Pydantic e dos handlers em [backend/src/valora_backend/api/rules.py](../../backend/src/valora_backend/api/rules.py):
  - `ScopeInputRecord`
  - `ScopeInputCreateRequest`
  - `ScopeInputPatchRequest`
  - `create_scope_event_input` (construção de `Input`)
  - `patch_scope_event_input` (bloco `if "age" in body.model_fields_set`)
  - `list_scope_event_inputs` (montagem de `ScopeInputRecord`)
- [x] Ajustar [backend/erd.json](../../backend/erd.json): remover o campo `age` da tabela `input`, atualizar o comentário da tabela `input`, limpar a referência a `input.age` no comentário de `result.age` e no sticky note "result - cálculo".
- [x] Remover `age?: number | null;` de `ScopeInputRecord` em [frontend/src/lib/auth/types.ts](../../frontend/src/lib/auth/types.ts).
- [x] Adicionar nota de atualização no topo de [plan-idade-input-result-erd-para-bd.md](plan-idade-input-result-erd-para-bd.md) indicando a remoção.
- [ ] Executar `pytest` no backend e `alembic upgrade head` + `alembic downgrade -1` localmente.

## Notas

- A tabela `input` **não** é monitorizada pelas triggers de auditoria (ver [.cursor/skills/audit-log-triggers/SKILL.md](../skills/audit-log-triggers/SKILL.md)); logo não houve necessidade de desabilitar trigger durante a migração.
- Valores existentes em `input.age` (se houver em ambiente) são descartados pela migração; o impacto funcional é nulo porque nenhum caminho de código dependia deles.
- Se, no futuro, surgir a necessidade de "input recorrente por idade", a modelagem deverá ser retomada em conjunto com a alteração do motor (indexar runtime por `(field_id, age)`), e não apenas reintroduzir a coluna.
