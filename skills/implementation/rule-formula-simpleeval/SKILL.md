---
name: rule-formula-simpleeval
description: User-configurable formula steps evaluated with simpleeval (whitelist functions, named steps, accumulated context). Use when implementing or reviewing backend rule expressions, security of eval surfaces, or wiring formulas to the daily calc engine and provenance.
---

# Expressões de regra com SimpleEval (passos nomeados)

## Objetivo

Padronizar a execução de **expressões Python restritas** com **[simpleeval](https://pypi.org/project/simpleeval/)** em **cadeia de passos com nomes** (`step_list`: cada passo tem `name` e `expression`), em vez de `exec`/`eval` livre ou scripts multilinha não controlados.

## Quando usar

- Implementar ou rever **fórmulas configuráveis** no backend.
- Rever **segurança** e superfície de funções expostas ao utilizador.
- Alinhar com o fluxo do [motor diário](../../core/daily-calc-engine/SKILL.md) e com a **proveniência** dos valores calculados.

## Contrato do passo

Cada item de `step_list` segue o formato:

- `name`: identificador do resultado deste passo (string).
- `expression`: **uma** expressão avaliável pelo SimpleEval (string).

O **contexto** é um dicionário que começa com `input_context` e, após cada passo, passa a incluir `context[name] = valor` do passo atual. **A ordem dos passos é semântica**: passos posteriores podem referenciar nomes definidos em passos anteriores.

### `formula.statement` na API (atribuição)

O texto persistido em [`formula.statement`](../../../backend/src/valora_backend/model/rules.py) usa **uma única linha lógica** de atribuição:

- **Lado esquerdo:** exclusivamente `${field:<id>}` (quem recebe o valor).
- **Separador:** primeiro caractere `=` na instrução (após trim).
- **Lado direito:** expressão de cálculo com referências `${field:…}` e funções da lista branca; internamente substituídas por nomes `f_<id>` para o SimpleEval.

Na gravação (`POST`/`PATCH` de fórmulas), o backend valida este formato, a existência dos `field_id` no escopo e um **dry-run** da RHS com valores stub (`Decimal("0")` por campo referido na expressão). Códigos estáveis de erro: `formula_invalid_assignment`, `formula_invalid_target`, `formula_unknown_field_id`, `formula_expression_invalid`. Implementação: `valora_backend/rules/formula_statement_validate.py` e `formula_simple_eval.py`.

## API conceptual

- `build_evaluator(context)`  
  Constrói um `SimpleEval` com `names` ligado ao contexto atual e `functions` restrito a uma **lista branca** (ver abaixo).

- `execute_steps(input_context, step_list) -> dict`  
  Executa os passos em sequência e devolve o **contexto final** (entradas + todos os nomes de passo).

- `RuleExecutionError`  
  Exceção de domínio ao falhar um passo; a mensagem deve identificar o `name` do passo e, quando fizer sentido, trecho da `expression` (sem vazar dados sensíveis em logs públicos).

Implementação de referência (exemplo completo): [reference.md](./reference.md).

## Funções permitidas (baseline)

O conjunto inicial documentado para o projeto:

| Função   | Uso típico                          |
|----------|-------------------------------------|
| `date`   | Construir datas para comparações    |
| `abs`    | Valor absoluto                      |
| `min`    | Mínimo                              |
| `max`    | Máximo                              |
| `round`  | Arredondamento                      |
| `Decimal`| Valores monetários / precisão fixa  |

**Novas funções** só entram na lista branca após **revisão explícita** (superfície de ataque, determinismo, efeitos colaterais).

## Limitações explícitas

- Cada `expression` é **uma** expressão SimpleEval: **sem** `import`, **sem** módulo completo, **sem** atribuições dentro da string (usar **passos nomeados** para variáveis intermédias).
- Não usar este padrão misturado com **FEEL**, **JSONLogic** ou outro motor na mesma regra sem decisão arquitectural e contrato de proveniência claros.

## Proveniência

Alinhar com:

- [Proveniência do motor diário](../../core/daily-calc-engine/references/provenance.md)
- [Princípios do sistema](../../../architecture/system-principles.md)

Ao persistir regras executadas pelo utilizador, gravar identificador e **versão** da regra, e inputs necessários para **reproduzir e explicar** o resultado (o que o contrato de proveniência já exige para valor derivado).

## Dependência

O pacote `simpleeval` está declarado em `backend/pyproject.toml` (intervalo de versão fixado, por exemplo `>=1.0.7,<2`). Em upgrades, rever changelog e regressões de segurança.

## Segurança

- Confiar na **lista branca** do SimpleEval (`functions` e conteúdo de `names`), não em `eval`/`exec` sem restrições.
- **Não** expor `__builtins__` completos ao avaliador.
- Em upgrades do pacote `simpleeval`, rever changelog e regressões de segurança.

## Referências

- Exemplo executável: [reference.md](./reference.md)
- Motor diário: [skills/core/daily-calc-engine/SKILL.md](../../core/daily-calc-engine/SKILL.md)
