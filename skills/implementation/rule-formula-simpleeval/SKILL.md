---
name: rule-formula-simpleeval
description: Validação e avaliação restrita de `formula.statement` com simpleeval (lista branca de funções), com atribuição direta para `${field:id}` e sem variáveis intermediárias entre fórmulas.
---

# Expressões de regra com SimpleEval (atribuição direta)

## Objetivo

Padronizar a validação de **expressões Python restritas** com **[simpleeval](https://pypi.org/project/simpleeval/)** para `formula.statement` no contrato atual da API, evitando `exec`/`eval` livre ou scripts multilinha não controlados.

## Quando usar

- Implementar ou rever **fórmulas configuráveis** no backend.
- Rever **segurança** e superfície de funções expostas ao utilizador.
- Alinhar com o fluxo do [motor diário](../../core/daily-calc-engine/SKILL.md) e com a **proveniência** dos valores calculados.

## `formula.statement` na API (atribuição)

O texto persistido em [`formula.statement`](../../../backend/src/valora_backend/model/rules.py) usa **uma única linha lógica** de atribuição:

- **Lado esquerdo:** exclusivamente `${field:<id>}` (quem recebe o valor).
- **Separador:** primeiro caractere `=` na instrução (após trim).
- **Lado direito:** expressão de cálculo com referências `${field:…}` e `${input:…}` e funções da lista branca; internamente substituídas por nomes `f_<id>` e `i_<id>` para o SimpleEval.
- **Regra de modelagem:** não há variáveis ou campos temporários intermediários entre fórmulas no contrato atual. Cada fórmula atribui diretamente para `${field:<id>}`.

### Cuidado com `=` na RHS

Qualquer **`=`** adicional na mesma linha quebra o contrato de **uma única** atribuição. Por isso **não** use argumentos nomeados que contenham `=` na RHS (ex.: `timedelta(days=1)`). Prefira argumentos posicionais: `timedelta(1)` soma um dia, `timedelta(7)` soma sete dias (equivalente prático a uma semana). Meses e anos usam as funções `add_months` e `add_years` da lista branca.

Na gravação (`POST`/`PATCH` de fórmulas), o backend valida este formato, a existência dos `field_id` no escopo e um **dry-run** da RHS com valores **stub por tipo** de cada campo referido (ver secção seguinte). Códigos estáveis de erro: `formula_invalid_assignment`, `formula_invalid_target`, `formula_unknown_field_id`, `formula_expression_invalid`. Implementação: `valora_backend/rules/formula_statement_validate.py`, `formula_simple_eval.py` e `field_sql_formula.py`.

## Dry-run (stubs)

Ao validar a RHS, cada referência `${field:id}` ou `${input:id}` recebe um valor de teste coerente com o `field.type` SQL daquele id no escopo:

| Família do tipo (`field.type`) | Stub |
|-------------------------------|------|
| texto | `""` |
| `BOOLEAN` | `False` |
| inteiro | `0` |
| numérico (incl. `NUMERIC`, `DECIMAL`, `FLOAT`, …) | `0` (inteiro; evita falha de dry-run em expressões com literais `float`, ex.: `f_1 + 0.20`) |
| `DATE` | `date(2000, 1, 1)` |
| `TIMESTAMP` / `TIMESTAMPTZ` (e variantes com precisão) | `datetime(2000, 1, 1, 0, 0, 0)` |

## Inputs ausentes e fallback

Em execução, quando a RHS referencia `${input:id}` mas o evento não traz valor para aquele campo, o avaliador vincula `i_<id> = None` em vez de abortar imediatamente. Em seguida:

- Se a expressão conseguir produzir um valor válido (ex.: via `coalesce(${input:id}, <fallback>)` ou `<expr> if <cond> else <alt>`) e a coerção ao tipo do campo alvo funcionar, esse valor é usado normalmente.
- Se a avaliação **ou** a coerção ao tipo do campo alvo falharem, o backend levanta o erro estável `current_age_formula_input_missing` (mesmo `code` e estrutura de hoje), referente ao primeiro input ausente pela ordem de `field_id`.

Com isso, `${field:X} = ${input:X}` com input ausente continua falhando com `current_age_formula_input_missing` (não há fallback na expressão). Já `${field:X} = coalesce(${input:X}, ${field:Y})` com input ausente usa o valor de `${field:Y}`.

Exemplos equivalentes de fallback:

- `${field:mortes} = coalesce(${input:mortes}, ${field:mortes_std})`
- `${field:mortes} = ${input:mortes} if ${input:mortes} is not None else ${field:mortes_std}`

No dry-run de validação (ao gravar a fórmula), os inputs continuam recebendo **stub tipado** (não `None`). O comportamento com `None` só é exercitado em runtime, e apenas quando o input falta de fato.

No **carry-forward** (idades intermediárias da janela sem evento real), as fórmulas com `${input:id}` também tentam avaliar com input ausente (`None`). Se a fórmula conseguir produzir valor válido (ex.: via `coalesce`), ele é usado. Se falhar no eval ou na coerção, o motor mantém o comportamento histórico de **copiar o último resultado real** daquele campo. Isso faz com que um fallback estático (ex.: `coalesce(${input:X}, ${field:X_std})`) tenha efeito também nas idades sem evento informado.

## Tipos temporais na execução

- **`DATE`:** valores em runtime são `datetime.date`; resultado persistido em `result.text_value` como `YYYY-MM-DD`.
- **`TIMESTAMP` / `TIMESTAMPTZ`:** valores em runtime são `datetime.datetime` **naive** (sem fuso); resultado em `text_value` em ISO (segundos típicos, ex.: `2024-03-15T14:30:00`).
- **Entrada do utilizador:** strings ISO aceites por `date.fromisoformat` / `datetime.fromisoformat` (com `Z` opcional convertido para instante e depois armazenado como naive conforme o backend).
- **Valor default** quando um campo referido ainda não existe no estado do grupo: `1970-01-01` (data) ou `1970-01-01T00:00:00` (data e hora), de forma determinística.

## API conceitual

- `build_formula_simple_eval(names)`  
  Constrói um `SimpleEval` com `names` e `functions` restritos à lista branca.

- `validate_formula_statement_for_scope(session, scope_id, statement)`  
  Valida a atribuição (`LHS = RHS`), confirma referências no escopo e faz dry-run da `RHS`.

Implementação de referência: [reference.md](./reference.md).

## Funções permitidas (lista branca atual)

| Função | Uso típico |
|--------|------------|
| `date` | Construir `date` |
| `datetime` | Construir `datetime` |
| `timedelta` | Somar dias (`timedelta(1)`), horas, etc. |
| `add_months` | Somar meses de calendário a `date` ou `datetime` |
| `add_years` | Somar anos de calendário a `date` ou `datetime` |
| `abs` | Valor absoluto |
| `min` | Mínimo |
| `max` | Máximo |
| `round` | Arredondamento |
| `Decimal` | Valores monetários ou precisão fixa |
| `coalesce` | Retorna o primeiro argumento quando não é `None`; caso contrário o segundo. Útil com `${input:id}` ausente (ver secção "Inputs ausentes e fallback"). |

**Novas funções** só entram na lista branca após **revisão explícita** (superfície de ataque, determinismo, efeitos colaterais).

## Limitações explícitas

- Cada `statement` deve seguir atribuição única `${field:id} = <expressão>`.
- Cada `expression` é **uma** expressão SimpleEval: **sem** `import`, **sem** módulo completo e sem outro operador de atribuição fora do separador principal (nem `=` em argumentos nomeados na RHS; ver secção acima).
- Não usar este padrão misturado com **FEEL**, **JSONLogic** ou outro motor na mesma regra sem decisão arquitectural e contrato de proveniência claros.

## Proveniência

Alinhar com:

- [Proveniência do motor diário](../../core/daily-calc-engine/references/provenance.md)
- [Princípios do sistema](../../../architecture/system-principles.md)

Ao persistir regras executadas pelo utilizador, gravar identificador e **versão** da regra, e inputs necessários para **reproduzir e explicar** o resultado (o que o contrato de proveniência já exige para valor derivado).

## Dependências

- `simpleeval`: declarado em `backend/pyproject.toml` (intervalo de versão fixado, por exemplo `>=1.0.7,<2`). Em upgrades, rever changelog e regressões de segurança.
- `python-dateutil`: usado internamente por `add_months` / `add_years` (relativedelta). Em upgrades, rever changelog.

## Segurança

- Confiar na **lista branca** do SimpleEval (`functions` e conteúdo de `names`), não em `eval`/`exec` sem restrições.
- **Não** expor `__builtins__` completos ao avaliador.
- Em upgrades do pacote `simpleeval`, rever changelog e regressões de segurança.

## Referências

- Exemplo executável: [reference.md](./reference.md)
- Motor diário: [skills/core/daily-calc-engine/SKILL.md](../../core/daily-calc-engine/SKILL.md)
