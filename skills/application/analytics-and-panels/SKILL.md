---
name: analytics-and-panels
description: Use quando desenhar visão analítica, contrato de painel, formatação por localidade e agregação sobre a base de fato diário para análise diária, semanal, mensal, anual e por período personalizado, incluindo conversão cambial apenas no relatório.
---

# Camada analítica e painel

Use esta skill para entrega analítica e de relatório.

Leia estas referências conforme necessário:
- 'references/analytic-grains.md'
- 'references/official-views.md'
- 'references/panel-contracts.md'
- 'references/filters-and-slices.md'

## Fluxo

1. Parta do fato diário materializado.
2. Defina o grão analítico oficial e a agregação permitida.
3. Especifique contrato de painel, comportamento de localidade e comportamento de período.
4. Aplique conversão cambial apenas como derivação no momento do relatório, quando houver solicitação.
5. Mantenha cálculo consistente entre visão diária e visão por período.

## Restrições

- Não crie número de painel desconectado do fato diário.
- Não trate painel semanal como fonte nativa da verdade.
- Defina explicitamente a semântica semanal quando ela fizer parte do contrato do produto.
- Mantenha filtro e regra de acumulação explícitos.
- Não persista valor convertido para relatório como se fosse fato de origem.
- Não trate relatório em moeda convertida como registro financeiro auditável.

## Entregáveis

- Grão analítico oficial.
- Contrato de painel.
- Semântica de filtro e período.
