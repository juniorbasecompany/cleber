---
name: spreadsheet-migration
description: Use quando traduzir planilha existente em contrato explícito de sistema, mapeando aba e fórmula para entidade, evento, atributo, regra, curva e fato diário, com verificação de paridade.
---

# Migração de planilha

Use esta skill quando a fonte de verdade ou o comportamento de referência ainda estiver em planilha.

Leia estas referências conforme necessário:
- 'references/workbook-inventory.md'
- 'references/mapping-rules.md'
- 'references/parity-checks.md'

## Fluxo

1. Faça o inventário da pasta de trabalho, da aba e da saída relevante.
2. Classifique cada artefato da planilha como entidade, evento, atributo, regra, curva, fato ou saída de painel.
3. Converta fórmula implícita em lógica governada do sistema.
4. Valide a paridade contra saída diária e agregada.

## Restrições

- Não copie a estrutura da planilha diretamente para o modelo do núcleo.
- Não deixe fórmula importante de negócio implícita.
- Registre ambiguidade em vez de adivinhar silenciosamente.

## Entregáveis

- Inventário da pasta de trabalho.
- Tabela de mapeamento da lógica de planilha para contrato do sistema.
- Plano de verificação de paridade.
