---
name: economic-and-commercial-layer
description: Use quando modelar ou revisar a camada econômica e comercial diária: preço em moeda local, faturamento, custo, margem, lucro, saldo operacional e conversão cambial apenas no relatório, da produção até a unidade comercial.
---

# Camada econômica e comercial

Use esta skill para a camada de negócio que vai além da produção técnica.

Leia estas referências conforme necessário:
- 'references/economic-model.md'
- 'references/commercial-flow.md'
- 'references/contribution-margin.md'

## Fluxo

1. Parta do fato diário de produção.
2. Converta saída técnica em medida comercial e econômica na moeda local da operação.
3. Preserve fato diário de faturamento, custo e margem apenas em moeda local.
4. Trate qualquer outra moeda como visão derivada resolvida no momento da consulta.
5. Audite o histórico financeiro apenas na moeda local.
6. Agregue depois por semana, mês, ano ou qualquer período.

## Restrições

- Não modele a economia apenas no nível semanal.
- Não separe custo e faturamento da mesma base analítica diária.
- Mantenha explícita a regra de conversão de unidade.
- Não persista taxa de câmbio nem valor convertido no fato econômico original.
- Exija país persistido ou contexto equivalente de moeda local em toda operação econômica.
- Não trate relatório convertido como histórico financeiro auditável de origem.

## Entregáveis

- Modelo econômico diário.
- Mapeamento do fluxo comercial.
- Contrato de margem e lucro.
- Limite de auditoria entre fato em moeda local e relatório convertido.
