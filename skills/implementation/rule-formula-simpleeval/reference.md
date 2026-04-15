# Referência: `build_formula_simple_eval` e validação de `statement`

Exemplo alinhado ao contrato atual de `formula.statement`: atribuição direta para `${field:id}`, sem variáveis intermediárias entre fórmulas.

```python
from datetime import date, datetime, timedelta
from decimal import Decimal

from valora_backend.rules.formula_simple_eval import build_formula_simple_eval


if __name__ == "__main__":
    # Após mapeamento de tokens: `${field:2} + ${input:3}` -> `f_2 + i_3`
    evaluator = build_formula_simple_eval({"f_2": 10, "i_3": 5})
    result = evaluator.eval("f_2 + i_3")
    print("Resultado de dry-run:", result)

    # Exemplo com data (stub real depende do `field.type` no escopo)
    ev2 = build_formula_simple_eval({"f_1": date(2000, 1, 1)})
    print(ev2.eval("f_1 + timedelta(1)"))

    # Um mês a mais (calendário), via `dateutil.relativedelta` encapsulado em `add_months`
    ev3 = build_formula_simple_eval({"f_1": date(2000, 1, 15)})
    print(ev3.eval("add_months(f_1, 1)"))
```

## Divisão e resto (`/`, `//`, `%`)

No avaliador usado em dry-run e execução ([`formula_simple_eval.py`](../../../backend/src/valora_backend/rules/formula_simple_eval.py)), os operadores de divisão real (`/`), divisão inteira (`//`) e módulo (`%`) são **seguros para divisor zero**: em caso de `ZeroDivisionError`, o resultado é **0** (inclui subtipos como `decimal.DivisionByZero` na divisão real).

## Atenção ao separador `=`

O parser usa o **primeiro** `=` da instrução como separador entre alvo e expressão. Evite **outro** `=` na RHS, por exemplo em chamadas com argumento nomeado (`timedelta(days=1)`). Para somar um dia, use forma posicional, por exemplo `timedelta(1)` (um dia) ou `timedelta(7)` (sete dias).
