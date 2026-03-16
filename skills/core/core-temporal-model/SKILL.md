---
name: core-temporal-model
description: Use quando modelar ou revisar o núcleo estrutural fixo do sistema: entidade, escopo hierárquico com país opcional, vigência por evento, persistência em UTC, auditabilidade, integridade e fato diário materializado em todo nicho suportado.
---

# Núcleo temporal

Use esta skill para decisão estrutural que precisa permanecer estável entre nichos.

Leia estas referências conforme necessário:
- 'references/entities.md' para entidade estrutural e limite do núcleo.
- 'references/temporal-rules.md' para vigência e reconstrução.
- 'references/scope-hierarchy.md' para resolução de escopo e fallback.

## Fluxo

1. Confirme que a proposta mantém o eixo de cálculo diário.
2. Separe entidade estrutural de vocabulário de nicho.
3. Resolva referência temporal de negócio, como idade, estágio fenológico, safra ou janela operacional, como estado do dia, e não como grão nativo separado.
4. Modele mudança operacional como evento datado, auditável e persistido em UTC.
5. Inclua país como nó opcional de escopo e persista o país resolvido sempre que o fato econômico depender da moeda local.
6. Preserve histórico e reconstruibilidade.
7. Persista saída relevante como fato diário materializado.

## Restrições

- Não codifique vocabulário de nicho no esquema do núcleo.
- Não trate semana ou mês como grão nativo de cálculo.
- Não crie eixo paralelo de cálculo para idade, estágio, safra ou janela operacional.
- Não substitua semântica estrutural por JSONB livre.
- Não sobrescreva valor passado; versione e date.
- Não deixe contexto mutável do usuário definir o país persistido de um fato econômico.

## Entregáveis

- Modelo de entidade estrutural.
- Regra temporal de vigência e histórico.
- Definição de hierarquia de escopo e fallback.
- Contrato de fato diário com proveniência e versionamento.
