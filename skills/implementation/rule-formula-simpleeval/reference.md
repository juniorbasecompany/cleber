# Referência: `build_evaluator` e `execute_steps`

Exemplo completo do padrão de passos nomeados com SimpleEval. No repositório, a lista branca alinhada a este exemplo está em `backend/src/valora_backend/rules/formula_simple_eval.py` (`build_formula_simple_eval`), usada na validação ao gravar `formula.statement`.

```python
from datetime import date
from decimal import Decimal
from typing import Any

from simpleeval import SimpleEval


class RuleExecutionError(Exception):
    pass


def build_evaluator(context: dict[str, Any]) -> SimpleEval:
    s = SimpleEval()

    # variáveis disponíveis na expressão
    s.names = context

    # funções permitidas
    s.functions = {
        "date": date,
        "abs": abs,
        "min": min,
        "max": max,
        "round": round,
        "Decimal": Decimal,
    }

    return s


def execute_steps(
    input_context: dict[str, Any],
    step_list: list[dict[str, str]],
) -> dict[str, Any]:
    context = dict(input_context)

    for step in step_list:
        name = step["name"]
        expression = step["expression"]

        try:
            evaluator = build_evaluator(context)
            value = evaluator.eval(expression)
        except Exception as exc:
            raise RuleExecutionError(
                f"Erro ao executar o passo '{name}': {expression}"
            ) from exc

        context[name] = value

    return context


if __name__ == "__main__":
    input_context = {
        "a": 10,                 # integer
        "b": 13,                 # integer
        "c": 20.0,               # number
        "d": date(2026, 1, 10),  # date
        "flag": False,           # boolean
    }

    step_list = [
        {
            "name": "base",
            "expression": "a * c",
        },
        {
            "name": "x",
            "expression": "base + b if flag else base - b",
        },
        {
            "name": "result",
            "expression": "x + 10 if d > date(2026, 1, 1) else x + 5",
        },
    ]

    output_context = execute_steps(input_context, step_list)

    print("Contexto final:")
    for key, value in output_context.items():
        print(f"  {key} = {value!r}")

    print()
    print("Resultado final:", output_context["result"])
```
