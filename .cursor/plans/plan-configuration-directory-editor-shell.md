# Plano: shell de política para diretório + editor

Resumo acionável do desenho aprovado (detalhe completo pode existir noutro ficheiro de plano do Cursor).

## Objetivo

Segunda camada acima de `ConfigurationDirectoryEditorLayout`: política do corpo do editor + helpers de footer partilhados; clientes escopo e locais migrados; documentação em `architecture/configuration-panels.md`; apontamento na skill `interface-product-direction`.

## Entregas

- [x] `frontend/src/component/configuration/configuration-directory-editor-policy.ts`
- [x] `frontend/src/component/configuration/configuration-directory-editor-shell.tsx`
- [x] Migração: `scope-configuration-client.tsx`, `location-configuration-client.tsx`
- [x] Tipo exportado: `ConfigurationDirectoryEditorLayoutProps` no layout
- [x] `architecture/configuration-panels.md` — secção diretório + editor, tabela de padrões A/B
- [x] `.cursor/skills/interface-product-direction/SKILL.md` — parágrafo diretório + editor

## Verificação

- `npx tsc --noEmit` em `frontend/`
- Smoke: escopo e locais (lista/árvore, salvar, delete pendente, footer)

## Fora de âmbito (v1)

- `member-configuration-client` no Shell (layout tabbed distinto); documentado como padrão B.
