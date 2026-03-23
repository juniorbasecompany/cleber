---
name: stack
description: Stack oficial de frontend e backend (Next.js, React, TypeScript, Tailwind; FastAPI, SQLAlchemy, Alembic, PostgreSQL). Use em implementação ou revisão de código que toque em front, API, banco, migrations ou dependências de runtime.
---

# Stack de implementação

## Objetivo

Aplicar o stack acordado em [architecture/technology-stack.md](../../../architecture/technology-stack.md) em qualquer tarefa de implementação ou revisão do `frontend/` e do `backend/`.

## Quando usar

- Criar ou alterar código no frontend ou no backend.
- Propor novas dependências de runtime ou ferramentas de build.
- Rever PR ou diff que introduza tecnologia paralela (outro framework, outro ORM, etc.).
- Criar ou alterar migrations, modelos ORM, rotas de API ou contratos entre frontend e backend.

## Regras

### Frontend

- Usar **Next.js**, **React**, **TypeScript** e **Tailwind CSS**.
- Seguir a configuração existente de `eslint` / `eslint-config-next` quando ela estiver declarada no `package.json`.
- Tratar `frontend/src/app/globals.css` como fonte única de verdade para tokens visuais, primitives de layout, classes semânticas `ui-*` e modificadores reutilizáveis.
- Fazer ajustes de layout e aparência no `globals.css`, não em `className` local de componente, quando a decisão for parte do padrão da interface.
- Deixar o componente responsável por semântica, estrutura e comportamento; deixar borda, fundo, sombra, densidade, espaçamento estrutural e variantes visuais compartilhadas sob governo do CSS global.
- Quando surgir necessidade visual repetível, primeiro criar ou ajustar a classe reutilizável em `globals.css`; só depois consumi-la no componente.

### Internacionalização

- Seguir [skills/implementation/i18n/SKILL.md](../i18n/SKILL.md) e [skills/implementation/i18n/policy.md](../i18n/policy.md) para texto de interface e mensagens visíveis ao utilizador.
- Evitar literals soltos em interface.
- Preferir erro de API com `code` estável quando o cliente precisar traduzir a mensagem.

### Painéis de configuração

- Seguir [architecture/configuration-panels.md](../../../architecture/configuration-panels.md) ao implementar ou revisar painéis de configuração.
- Usar sinalização visual para exclusão pendente: tonalidade suave de vermelho no painel e ação de perigo em estado de desfazer marcação.
- Não introduzir banner, alerta ou aviso textual dedicado apenas para informar que o registro está marcado para exclusão.

### Backend

- Usar **FastAPI**, **SQLAlchemy**, **Alembic**, **PostgreSQL**, **Pydantic** e **Uvicorn**.
- Respeitar o que já estiver declarado em [backend/pyproject.toml](../../../backend/pyproject.toml).
- Não propor **SQLModel** como ORM principal nem substituir SQLAlchemy por outro ORM sem mudança explícita em [architecture/technology-stack.md](../../../architecture/technology-stack.md) e nesta skill.

### Encoding e texto

- Salvar arquivos de código, migrations, configuração e documentação em **UTF-8**.
- Preservar acentuação correta em português; não introduzir mojibake como `Ã`, `Â` ou sequências equivalentes.
- Não confiar apenas na renderização do terminal do Windows para validar encoding; quando houver dúvida, reler o arquivo explicitamente como UTF-8.
- Normalizar o texto das linhas alteradas quando o arquivo tocado já estiver com encoding corrompido na área editada.

### Proibições

- Não introduzir outro framework de UI (por exemplo Vue, Svelte, Angular) nem outro ORM “por conveniência” sem atualizar a documentação canónica acima.
- Não duplicar lista de versões pinadas em Markdown; usar [frontend/package.json](../../../frontend/package.json) e [backend/pyproject.toml](../../../backend/pyproject.toml) como fonte.

## Referências

- [architecture/technology-stack.md](../../../architecture/technology-stack.md)
- [architecture/configuration-panels.md](../../../architecture/configuration-panels.md)
- [frontend/package.json](../../../frontend/package.json)
- [backend/pyproject.toml](../../../backend/pyproject.toml)
