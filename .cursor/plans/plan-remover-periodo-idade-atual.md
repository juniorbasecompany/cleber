# Plano: remover período na idade atual e ancorar horizonte em initial/final age

## Objetivo

- Eliminar **Data inicial** / **Data final** da UI e do corpo da API para `read-current-age`, `calculate-current-age` e `delete-current-age`.
- Manter apenas filtros opcionais: `unity_id`, `location_id`, `item_id` (local = `location_id`, não i18n `locale`).
- **Determinar a sequência do campo de idade atual (`is_current_age`) e o limite temporal do cálculo** usando os metadados de campo já existentes: **`Field.is_initial_age`** e **`Field.is_final_age`**, em conjunto com **`Field.is_current_age`** (resolvido em `_resolve_scope_age_fields_or_400`).

## Decisões já fechadas

- **Delete sem filtros**: permitido (risco de escopo inteiro aceito).
- **Sem período escolhido pelo usuário**: o cálculo deixa de depender de datas de formulário (`moment_from` / `moment_to`). Continua a existir **ordem temporal** implícita nos **eventos** (`moment_utc` na linha do evento, quando houver), porque o motor precisa ordenar o que acontece primeiro e o que acontece depois; o que se elimina é a **janela externa** que cortava leitura, persistência e recorrência.

## Como funciona a janela de cálculo (conceito)

### O que é um “grupo”

- Eventos são agrupados por **`(location_id, item_id)`**: no mesmo local, para o mesmo item (ex.: lote ou animal), o estado de idade (`group_state`) é **um só** e vai sendo atualizado ao longo das ocorrências.

### O que é uma “janela”

- Uma **janela** é um intervalo lógico da vida do item nesse par local+item, delimitado por valores nos campos marcados com **`is_initial_age`** e **`is_final_age`**.
- Em [`_build_window_meta_by_event_id`](backend/src/valora_backend/api/rules.py), o código percorre os eventos do grupo **em ordem cronológica** (já ordenada antes). Quando encontra um evento em que existe **idade inicial** (em input ou já materializada em resultado compatível), abre o rastreamento. Quando encontra um evento em que existe **idade final**, **fecha** um retângulo de janela e copia o mesmo metadado de janela (`source_initial_age`, `source_final_age`, ids dos eventos fonte, etc.) para todos os eventos **entre** o de idade inicial e o de idade final (inclusive), conforme as regras do função.
- Ou seja: **não é o “nome da ação”** (alojamento, etc.) que o código interpreta literalmente; são os **campos** initial/final preenchidos nos eventos que **disparam** e **fecham** a janela. Na prática de produto, o primeiro evento relevante (ex.: alojamento) é onde o utilizador **informa** a idade inicial e, noutro evento, a idade final, e isso é o “gatilho”.

### O que é uma “ocorrência”

- Para cada evento com data na linha, existe pelo menos a ocorrência **no dia do evento** (`is_actual_event_day=True`).
- Se a **ação** é recorrente, o algoritmo gera **dias sintéticos** entre o dia seguinte ao evento e o último dia permitido pela simulação (hoje limitado por `moment_to_utc`; no plano, por limite derivado da idade final e da unidade), com o mesmo “relógio” do evento fonte.

### Ordem dentro de cada ocorrência (regra que você pediu)

- Para cada ocorrência, o motor executa **todas as fórmulas da action**, em ordem (`formula_list`).
- **Só depois** de avaliar todas as fórmulas dessa ocorrência é que o código olha para a **idade atual** no estado (`current_field`) e decide se a janela deve **pedir fechamento**: hoje, se `idade_atual >= source_final_age`, grava `close_after_day` para aquele grupo; nas ocorrências **de dias posteriores**, o grupo deixa de ser processado (trecho que compara `execution_day` com `close_after_day`).

```2999:3140:backend/src/valora_backend/api/rules.py
    for occurrence in occurrence_list:
        ...
        for formula_row in formula_list:
            ...
            group_state[target_field.id] = typed_payload["runtime_value"]
            if moment_from_utc <= execution_moment_utc <= moment_to_utc:
                ...  # persistência de Result por fórmula (quando ainda houver filtro de período)
        current_age_state = group_state.get(current_field.id)
        if current_age_state is not None:
            ...
            if normalized_current_age >= active_window["source_final_age"]:
                close_after_day_by_group[group_key] = {
                    "window": active_window,
                    "close_after_day": execution_day,
                }
```

- **Persistência** (`Result`): hoje está **dentro** do `for` de cada fórmula (e ainda condicionada ao período). A intenção do produto é remover o filtro de período; a regra de **encerrar** a janela já está **depois** das fórmulas, como acima.

### “Até quando” em termos de idade (o seu critério)

- O critério de parada é **domínio**, não calendário de ecrã: continua a haver ocorrências (reais ou recorrentes) enquanto o grupo ainda está ativo; a janela deixa de avançar quando a **idade atual** alcança o **valor final** acordado na janela (`source_final_age`), que vem do campo **`is_final_age`** no evento em que esse valor foi definido (input ou materialização anterior). Em termos de modelo, isso corresponde a alinhar **`Result.age`** (eixo de idade do resultado) com o **alvo** expresso em valor numérico do campo final; o código atual usa **`>=`** e encerra no dia em questão, com possível continuidade até ao fim desse dia conforme `close_after_day`.

## Regra de produto: initial / final age como fonte da sequência e do “até quando”

### Sequência (campo current age)

- O backend **já** resolve os três papéis de campo no escopo: idade inicial, idade final e idade atual ([`_resolve_scope_age_fields_or_400`](backend/src/valora_backend/api/rules.py)).
- A **ordenação temporal** das execuções e o estado por grupo `(location_id, item_id)` vêm de:
  - lista de eventos ordenada por data/ação;
  - [`_build_window_meta_by_event_id`](backend/src/valora_backend/api/rules.py), que associa cada evento elegível a uma **janela** com `source_initial_age`, `source_final_age`, `source_initial_event_id`, `source_final_event_id`, derivada de valores nos campos marcados como initial/final (via inputs e resultados existentes, conforme o fluxo atual).
- A **sequência em que as fórmulas que escrevem na idade atual** são avaliadas segue a lista de ocorrências já ordenada (`_build_execution_occurrence_list` + loop principal em `calculate_scope_current_age`): não é necessário um “período” externo para ordenar; a ordem é a do modelo de eventos + actions.

### Até quando calcular (substitui `moment_to_utc` e `period_end_day` global)

- Hoje, o fim da simulação de recorrência diária usa `period_end_day = moment_to_utc.date()` em [`_build_execution_occurrence_list`](backend/src/valora_backend/api/rules.py).
- **Nova regra**: para cada evento com `window_meta` ativo, o último dia em que faz sentido gerar ocorrências sintéticas de uma ação recorrente deve ser limitado pelo **fim da vida útil no modelo de idade** daquela janela, alinhado à mesma convenção de calendário já usada para resultados (`date(unity.creation_utc) + age` em [`_result_execution_calendar_date_sql_expr`](backend/src/valora_backend/api/rules.py)):
  - `recurrence_last_day` por janela/evento ≈ `date(unity.creation_utc) + source_final_age` (ajustando com o `min` existente contra o dia anterior ao próximo evento da mesma ação, quando aplicável).
- Assim, **`is_final_age`** (via `source_final_age` na janela) define **até que dia civil** a recorrência pode ir; **`is_initial_age`** participa da construção da janela e do estado inicial; **`is_current_age`** continua sendo o alvo das fórmulas de “idade atual”.

### Persistência de `Result` (substitui `moment_from_utc <= execution <= moment_to_utc`)

- Remover o filtro global por instantes escolhidos pelo usuário.
- Persistir resultados das fórmulas quando a execução ainda pertence à simulação definida pela janela e pelos limites acima (o loop já encerra grupos com `close_after_day` quando a idade atual atinge a final; validar que não fica lacuna com o novo `recurrence_last_day`).

### Leitura e delete

- **Read**: sem filtro de período; apenas escopo + filtros opcionais de unity/location/item (mesma base de eventos que o predicado atual já usa).
- **Delete**: sem período; conjunto de eventos alvo conforme filtros (e política já acordada para escopo inteiro).

## Impactos e mitigações

| Impacto | Mitigação |
|---------|-----------|
| API breaking (remoção de `moment_*`) | Atualizar frontend, tipos e testes na mesma entrega. |
| Volume de linhas no read sem período | Filtros opcionais; consciência de escopo grande. |
| Recorrência até `creation + final_age` pode ser longa | Coerente com o domínio; evita depender de datas arbitrárias na UI. |
| Eventos com `moment_utc` muito no futuro | Opcional: teto `moment_utc <= now()` na query de eventos como proteção; documentar se for adotado. |

## Ficheiros principais

- Backend: [`backend/src/valora_backend/api/rules.py`](backend/src/valora_backend/api/rules.py) (`ScopeCurrentAgeCalculationRequest`, `_list_scope_current_age_results`, `delete_scope_current_age`, `calculate_scope_current_age`, `_build_execution_occurrence_list`, trechos que usam `_result_execution_in_period` e momentos).
- Frontend: [`frontend/src/component/calculation/current-age-calculation-client.tsx`](frontend/src/component/calculation/current-age-calculation-client.tsx), [`frontend/src/lib/auth/types.ts`](frontend/src/lib/auth/types.ts).
- Testes: [`backend/tests/test_member_directory_api.py`](backend/tests/test_member_directory_api.py) e grep por `moment_from_utc` / `moment_to_utc`.

## Tarefas de implementação

1. Modelo de request só com `unity_id`, `location_id`, `item_id` opcionais; remover validação de período nos três endpoints.
2. Ajustar `_build_execution_occurrence_list` para usar limite por janela (`source_final_age` + `Unity.creation_utc` do evento), com acesso a `Unity` (ou mapa pré-carregado) por `event.unity_id`.
3. Remover/rever uso de `_result_execution_in_period` em read/delete/calculate conforme a nova semântica; ajustar `empty_reason` e copy.
4. Remover UI e payloads de período; atualizar testes e tipos.
