# Plano: página inicial do sistema

## Objetivo

Definir **o que** entregar como “página inicial” no Valora, **quais caminhos técnicos** fazem sentido e **em que pontos** investir atenção antes de codificar. Este documento é a referência para implementação futura; não substitui decisões finas de UX ou contratos de API.

## Contexto do repositório (março/2026)

- **Stack canónica do front:** Next.js, React, TypeScript, Tailwind CSS — ver [architecture/technology-stack.md](../architecture/technology-stack.md).
- **`frontend/`** ainda é um esqueleto (sem dependências de framework no `package.json`); a primeira entrega real implica **bootstrap do projeto Next.js** (ou equivalente alinhado à arquitectura).
- **`backend/`** expõe apenas `/health` e `/health/db`; **não há ainda** rotas de autenticação nem API de dados para widgets da home.
- Existem **mockups HTML** em `archive/ui-mockups/` que podem inspirar layout e linguagem visual, mas não são código de produção.

---

## O que significa “página inicial”

Antes de escolher tecnologia, convém separar três ideias que costumam ser chamadas de “home”:

| Conceito | Quem vê | Conteúdo típico |
|----------|---------|-------------------|
| **Landing pública** | Visitante sem login | Proposta de valor, entrada para cadastro/login, documentação/legal |
| **Home da aplicação (pós-login)** | Utilizador autenticado | Atalhos, resumo do contexto (tenant/unidade), alertas, últimas acções |
| **Redireccionamento** | Qualquer | `/` envia para `/login` ou `/app` conforme sessão — evita duas “homes” competindo |

**Recomendação para o Valora (produto B2B operacional):** tratar a **home principal como pós-login** (hub operacional ou dashboard leve), e tratar **landing pública** como página opcional ou fase posterior, salvo haver requisito explícito de marketing.

---

## Melhores alternativas (técnicas e de produto)

### 1. Stack e estrutura (alinhado à arquitectura)

- **Next.js (App Router)** + **React** + **TypeScript** + **Tailwind**: é a decisão já registada; App Router facilita **layouts** (shell comum), **loading/error** por segmento e evolução para rotas como `/app`, `/settings`, etc.
- **Componentização desde cedo:** layout (cabeçalho, navegação, área de conteúdo), mesmo que a home seja só placeholders — reduz retrabalho quando existir auth e dados reais.

### 2. Alternativas de conteúdo da primeira home

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **Hub mínimo** — mensagem de boas-vindas + links para módulos futuros | Rápido, barato de manter, alinha com backend ainda vazio | Pouco “wow”; precisa copy clara |
| **Dashboard com dados estáticos/mock** | Valida layout e componentes; útil para demo | Risco de mock “vazar” para produção sem disciplina |
| **Dashboard com API real** | Único caminho sustentável a médio prazo | Depende de endpoints, auth e modelo multi-tenant |
| **Espelhar mockups do `archive/ui-mockups/`** | Coerência visual com material já existente | Pode ser pesado para MVP; priorizar trechos reutilizáveis |

**Sugestão de faseamento:** (1) hub mínimo com shell e navegação stub → (2) integrar auth e contexto de tenant/conta → (3) widgets com API conforme módulos existirem.

### 3. Autenticação e roteamento

- Definir cedo se **`/`** é público, protegido ou só redirecciona — evita refactors de rota e de SEO mais tarde.
- Quando existir **tenant / account / member** (modelo já presente no backend em evolução), a home provavelmente deve **respeitar o contexto activo** (organização, unidade, etc.) — mesmo que na primeira versão isso seja só texto na barra.

### 4. Integração com o backend

- Contrato **REST/JSON** já é o padrão do projecto; a home não deve inventar canal paralelo.
- Para dados agregados (KPIs, alertas), antecipar **paginação, cache e estados vazios** — painéis “bonitos” falham primeiro quando não há dados.

### 5. Internacionalização e locale

- O domínio do projecto prevê **multi-país / locale** (skills e documentação); mesmo na v1 em um só idioma, convém **não hardcodar** strings em dezenas de sítios — preparar `messages` ou equivalente quando escolherem biblioteca i18n. Política e roadmap: [skills/implementation/i18n/policy.md](../../skills/implementation/i18n/policy.md).

### 6. Acessibilidade e qualidade de UI

- Estrutura semântica (`main`, `nav`, títulos), foco visível, contraste — custo baixo se feito desde o início.
- Estados: **carregamento**, **erro**, **vazio**; evitar página “muda” sem feedback.

### 7. Performance e operação

- **Core Web Vitals** se a landing for pública; para app autenticado, priorizar **tempo até interactivo** e evitar waterfalls de fetch na home.
- **Segurança:** não expor dados sensíveis em props de cliente; alinhar com política de cookies/sessão quando auth existir.

### 8. SEO (só relevante para parte pública)

- Metadados, `robots`, URLs estáveis — importante se houver marketing; **menos crítico** para área autenticada.

---

## Com o que nos preocupar (checklist resumida)

- [ ] **Definição de produto:** landing pública vs home autenticada vs redirect — e uma única narrativa para o utilizador.
- [ ] **Bootstrap do `frontend/`** com a stack canónica e convenções do repo (TypeScript, Tailwind, estrutura de pastas).
- [ ] **Shell da aplicação** (layout, navegação) reutilizável antes de encher a home de conteúdo.
- [ ] **Auth e multi-tenant:** placeholders ou integração real conforme roadmap do backend; home não deve assumir um único “utilizador global” se o modelo for organizacional.
- [ ] **Contratos de API:** versão inicial da home não deve bloquear evolução (tipos TypeScript compartilhados ou gerados quando fizer sentido).
- [ ] **Estados de UI:** loading / erro / vazio; mensagens em português na UI conforme regras do projecto.
- [ ] **i18n:** estratégia mínima (mesmo que só `pt-BR` no curto prazo).
- [ ] **Acessibilidade** básica e consistência com mockups ou design system quando existir.
- [ ] **Alinhamento com `docker-compose` / deploy:** como o front e o back são servidos em dev e em produção (variáveis `NEXT_PUBLIC_*`, proxy para API, CORS).

---

## Fases sugeridas (implementação)

1. **Fundação:** criar app Next.js em `frontend/`, página inicial stub, layout base, README com `npm run dev` e variáveis de ambiente.
2. **Home v1:** hub pós-login (ou rota `/app`) com conteúdo mínimo e navegação placeholder; redireccionamento `/` → login ou app conforme decisão.
3. **Integração:** auth + contexto de tenant/conta; chamadas à API para um ou dois blocos de resumo quando o backend estiver pronto.
4. **Evolução:** widgets adicionais, personalização por papel, performance e i18n completos.

---

## Referências internas

- [architecture/technology-stack.md](../architecture/technology-stack.md)
- [vision/solution-overview.md](../vision/solution-overview.md)
- Mockups: `archive/ui-mockups/`

---

## Decisões em aberto (preencher quando houver owner)

- Landing pública na mesma app Next ou projeto separado?
- Primeira rota canónica: `/`, `/app`, `/dashboard`?
- Idioma inicial único vs i18n desde o primeiro merge?
