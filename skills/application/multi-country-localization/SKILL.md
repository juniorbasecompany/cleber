---
name: multi-country-localization
description: Use quando desenhar ou revisar comportamento compatível com mais de um país: país opcional no escopo, rótulo, mensagem multilíngue e formatação por localidade, persistência em UTC com renderização local, fato econômico em moeda local e conversão cambial apenas no momento do relatório.
---

# Localização para múltiplos países

Use esta skill quando o sistema precisar se comportar corretamente em mais de um país sem transformar comportamento específico de país em rigidez do núcleo.

Leia estas referências conforme necessário:
- 'references/country-in-scope.md'
- 'references/locale-and-timezone.md'
- 'references/currency-behavior.md'
- 'references/reporting-conversion.md'

## Fluxo

1. Decida se o país é obrigatório no fluxo específico ou apenas opcional na hierarquia.
2. Diferencie padrão de interface de contexto operacional persistido.
3. Mantenha a persistência de back-end em UTC e a renderização no fuso horário local.
4. Mantenha o fato econômico apenas em moeda local.
5. Resolva rótulo traduzido, mensagem de UX e valor formatado no momento da exibição.
6. Aplique a ordem oficial de fallback de texto: país, local, usuário.
7. Trate relatório em múltipla moeda como derivação de consulta.

## Restrições

- Não exija país em todo caminho não econômico se a operação não precisar disso.
- Não deixe o contexto atual do usuário virar silenciosamente o país persistido de um fato econômico.
- Não armazene valor convertido nem taxa de câmbio no fato econômico de origem.
- Não transforme comportamento semanal em regra operacional específica de país.
- Mantenha sobrescrita específica de país dentro de fallback e metadado, e não em ramificação fixa de código.
- Não misture rótulo de domínio com mensagem geral de UX sem chave técnica e origem governada.
- Não deixe preferência textual do usuário alterar terminologia operacional persistida.

## Entregáveis

- Regra de escopo com consciência de país.
- Comportamento de localidade, idioma e fuso horário.
- Regra de fallback de texto multilíngue.
- Regra de persistência em moeda local.
- Contrato de conversão no momento da consulta para relatório.
- Limite de auditoria para visão financeira convertida.
