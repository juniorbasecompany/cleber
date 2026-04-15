# Plano: remover período na idade atual e ancorar horizonte em initial/final age

## Implementado (2026-04-14 a 2026-04-15)

- **`ScopeCurrentAgeCalculationRequest`** só expõe `unity_id`, `location_id` e `item_id` opcionais (sem janela de datas no corpo) — ver [`backend/src/valora_backend/api/rules.py`](../../backend/src/valora_backend/api/rules.py).
- **`_build_execution_occurrence_list`** limita recorrência com `period_end_day = date(unity.creation_utc) + source_final_age` (e `min` com o dia anterior ao próximo evento da mesma ação, quando aplicável), não com `moment_from` / `moment_to` da UI.
- O loop principal de **`calculate_scope_current_age`** agrupa ocorrências por **unidade e dia civil** (`_current_age_occurrence_unity_day_key`, `groupby`) e mantém estado por **`unity_id`** (`group_key = row.unity_id`).
- Frontend e tipos alinhados aos endpoints sem período; testes atualizados onde aplicável.

---

## Objetivo

- Eliminar **Data inicial** / **Data final** da UI e do corpo da API para `read-current-age`, `calculate-current-age` e `delete-current-age`.
- Manter apenas filtros opcionais: `unity_id`, `location_id`, `item_id` (local = `location_id`, não i18n `locale`).
- **Determinar a sequência do campo de idade atual (`is_current_age`) e o limite temporal do cálculo** usando os metadados de campo já existentes: **`Field.is_initial_age`** e **`Field.is_final_age`**, em conjunto com **`Field.is_current_age`** (resolvido em `_resolve_scope_age_fields_or_400`).

## Decisões já fechadas

- **Delete sem filtros**: permitido (risco de escopo inteiro aceito).
- **Sem período escolhido pelo usuário**: o cálculo deixa de depender de datas de formulário (`moment_from` / `moment_to`). Continua a existir **ordem temporal** implícita nos **eventos** (`moment_utc` na linha do evento, quando houver), porque o motor precisa ordenar o que acontece primeiro e o que acontece depois; o que se elimina é a **janela externa** que cortava leitura, persistência e recorrência.

## Como funciona a janela de cálculo (conceito)

### O que é um “grupo”

- O **estado de idade** (`group_state`) é **um por `unity_id`**: cada unidade (lote) tem o seu próprio mapa de valores por `field_id`, atualizado ao longo das ocorrências. O agrupamento temporal das ocorrências no motor usa **unidade + dia de execução** (ver `_current_age_occurrence_unity_day_key` e o `groupby` em `calculate_scope_current_age` em [`backend/src/valora_backend/api/rules.py`](../../backend/src/valora_backend/api/rules.py)).

### O que é uma “janela”

- Uma **janela** é um intervalo lógico da vida do item **naquela unidade**, delimitado por valores nos campos marcados com **`is_initial_age`** e **`is_final_age`**.
- Em [`_build_window_meta_by_event_id`](../../backend/src/valora_backend/api/rules.py), o código percorre os eventos **em ordem cronológica** (já ordenada antes). Quando encontra um evento em que existe **idade inicial** (em input ou já materializada em resultado compatível), abre o rastreamento. Quando encontra um evento em que existe **idade final**, **fecha** um retângulo de janela e copia o mesmo metadado de janela (`source_initial_age`, `source_final_age`, ids dos eventos fonte, etc.) para todos os eventos **entre** o de idade inicial e o de idade final (inclusive), conforme as regras da função.
- Ou seja: **não é o “nome da ação”** (alojamento, etc.) que o código interpreta literalmente; são os **campos** initial/final preenchidos nos eventos que **disparam** e **fecham** a janela. Na prática de produto, o primeiro evento relevante (ex.: alojamento) é onde o utilizador **informa** a idade inicial e, noutro evento, a idade final, e isso é o “gatilho”.

### O que é uma “ocorrência”

- Para cada evento com data na linha, existe pelo menos a ocorrência **no dia do evento** (`is_actual_event_day=True`).
- Se a **ação** é recorrente, o algoritmo gera **dias sintéticos** entre o dia seguinte ao evento e o último dia permitido pela simulação: **`recurrence_last_day`**, derivado de `date(unity.creation_utc) + source_final_age` e do próximo evento da mesma ação (ver `_build_execution_occurrence_list` em [`backend/src/valora_backend/api/rules.py`](../../backend/src/valora_backend/api/rules.py)), com o mesmo “relógio” do evento fonte.

### Ordem dentro de cada ocorrência (regra que você pediu)

- Para cada ocorrência, o motor executa **todas as fórmulas da action**, em ordem (`formula_list`).
- **Só depois** de avaliar todas as fórmulas dessa ocorrência é que o código olha para a **idade atual** no estado (`current_field`) e decide se a janela deve **pedir fechamento**: se `idade_atual >= source_final_age`, grava `close_after_day` para aquele `unity_id`; nas ocorrências **de dias posteriores**, o grupo deixa de ser processado (comparação de `execution_day` com `close_after_day`).

**Referência no código (substitui excertos antigos com filtro de período):** `calculate_scope_current_age`, persistência de `Result` por fórmula dentro do loop de ocorrências, sem condicionar a um `moment_from` / `moment_to` global do utilizador — ficheiro [`backend/src/valora_backend/api/rules.py`](../../backend/src/valora_backend/api/rules.py).

- **Persistência** (`Result`): gravação por fórmula com **`Result.age`** alinhado ao eixo de idade; não há filtro global por instantes escolhidos no pedido de idade atual.

### “Até quando” em termos de idade (o seu critério)

- O critério de parada é **domínio**, não calendário de ecrã: continua a haver ocorrências (reais ou recorrentes) enquanto o grupo ainda está ativo; a janela deixa de avançar quando a **idade atual** alcança o **valor final** acordado na janela (`source_final_age`), que vem do campo **`is_final_age`** no evento em que esse valor foi definido (input ou materialização anterior). Em termos de modelo, isso corresponde a alinhar **`Result.age`** (eixo de idade do resultado) com o **alvo** expresso em valor numérico do campo final; o código usa **`>=`** e encerra no dia em questão, com possível continuidade até ao fim desse dia conforme `close_after_day`.

## Regra de produto: initial / final age como fonte da sequência e do “até quando”

### Sequência (campo current age)

- O backend **já** resolve os três papéis de campo no escopo: idade inicial, idade final e idade atual ([`_resolve_scope_age_fields_or_400`](../../backend/src/valora_backend/api/rules.py)).
- A **ordenação temporal** das execuções e o estado por **`unity_id`** vêm de:
  - lista de eventos ordenada por data/ação;
  - [`_build_window_meta_by_event_id`](../../backend/src/valora_backend/api/rules.py), que associa cada evento elegível a uma **janela** com `source_initial_age`, `source_final_age`, `source_initial_event_id`, `source_final_event_id`, derivada de valores nos campos marcados como initial/final (via inputs e resultados existentes, conforme o fluxo atual).
- A **sequência em que as fórmulas que escrevem na idade atual** são avaliadas segue a lista de ocorrências já ordenada (`_build_execution_occurrence_list` + loop principal em `calculate_scope_current_age`): não é necessário um “período” externo para ordenar; a ordem é a do modelo de eventos + actions.

### Até quando calcular (limite da recorrência diária)

- Em [`_build_execution_occurrence_list`](../../backend/src/valora_backend/api/rules.py), para cada evento com `window_meta`, o último dia de ocorrências sintéticas de uma ação recorrente usa **`period_end_day = date(unity.creation_utc) + source_final_age`** (com `recurrence_last_day` ajustado pelo próximo evento da mesma ação quando aplicável), alinhado à convenção de calendário em [`_result_execution_calendar_date_sql_expr`](../../backend/src/valora_backend/api/rules.py).
- Assim, **`is_final_age`** (via `source_final_age` na janela) define **até que dia civil** a recorrência pode ir; **`is_initial_age`** participa da construção da janela e do estado inicial; **`is_current_age`** continua sendo o alvo das fórmulas de “idade atual”.

### Persistência de `Result` (sem janela `moment_from` / `moment_to` no pedido de idade atual)

- Sem filtro global por instantes escolhidos pelo usuário nesses endpoints.
- Persistir resultados das fórmulas quando a execução ainda pertence à simulação definida pela janela e pelos limites acima (encerramento com `close_after_day` quando a idade atual atinge a final).

### Leitura e delete

- **Read**: sem filtro de período; apenas escopo + filtros opcionais de unity/location/item.
- **Delete**: sem período; conjunto de eventos alvo conforme filtros (e política já acordada para escopo inteiro).

## Impactos e mitigações

| Impacto | Mitigação |
|---------|-----------|
| API breaking (remoção de `moment_*`) | Atualizar frontend, tipos e testes na mesma entrega. |
| Volume de linhas no read sem período | Filtros opcionais; consciência de escopo grande. |
| Recorrência até `creation + final_age` pode ser longa | Coerente com o domínio; evita depender de datas arbitrárias na UI. |
| Eventos com `moment_utc` muito no futuro | Opcional: teto `moment_utc <= now()` na query de eventos como proteção; documentar se for adotado. |

## Ficheiros principais

- Backend: [`backend/src/valora_backend/api/rules.py`](../../backend/src/valora_backend/api/rules.py) (`ScopeCurrentAgeCalculationRequest`, `_list_scope_current_age_results`, `delete_scope_current_age`, `calculate_scope_current_age`, `_build_execution_occurrence_list`, `_build_window_meta_by_event_id`, `_current_age_occurrence_unity_day_key`).
- Frontend: [`frontend/src/component/calculation/current-age-calculation-client.tsx`](../../frontend/src/component/calculation/current-age-calculation-client.tsx), [`frontend/src/lib/auth/types.ts`](../../frontend/src/lib/auth/types.ts).
- Testes: procurar por `calculate-current-age`, `read-current-age` e cenários de idade atual em `backend/tests/`.

## Tarefas de implementação (concluídas)

1. ~~Modelo de request só com `unity_id`, `location_id`, `item_id` opcionais; remover validação de período nos três endpoints.~~
2. ~~Ajustar `_build_execution_occurrence_list` para usar limite por janela (`source_final_age` + `Unity.creation_utc` do evento), com acesso a `Unity` (ou mapa pré-carregado) por `event.unity_id`.~~
3. ~~Remover uso de filtro por período global em read/delete/calculate; ajustar `empty_reason` e copy.~~
4. ~~Remover UI e payloads de período; atualizar testes e tipos.~~
