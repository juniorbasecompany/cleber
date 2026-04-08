# Fonte oficial

## Regra geral

A documentação do projeto tem autoridade explícita por camada.

1. `skills/` é a verdade operacional.
2. `architecture/` é a verdade decisória curta.
3. `vision/` é a explicação humana da solução.

## Modelo relacional do backend

- **Diagrama e metadados estruturais:** a fonte de verdade do ERD (formato drawDB) é [`backend/erd.json`](../backend/erd.json). Colunas, comentários, `constraints` declaradas no JSON e relacionamentos do diagrama orientam o alinhamento entre documentação, migrações e API.
- **Implementação física:** o schema efetivo no PostgreSQL vem das revisões Alembic em `backend/alembic/versions/` e dos modelos SQLAlchemy em `backend/src/valora_backend/model/`. Em caso de divergência entre diagrama e banco, o fluxo esperado é atualizar `erd.json` e depois refletir em modelo e migração (ou corrigir o diagrama se o banco já for a decisão vigente).
- **Contrato HTTP:** rotas e payloads expostos pela FastAPI devem ser consistentes com as tabelas e regras que efetivamente persistem dados; detalhes operacionais ficam em [`backend/README.md`](../backend/README.md) e, quando existir, no OpenAPI em tempo de execução (`/docs`).

## Convenções persistentes do agente

As convenções sempre ativas de idioma, escrita e nomenclatura ficam em `.cursor/rules/`.

- Essas regras complementam a documentação do projeto, mas não substituem decisão arquitetural nem contrato operacional.

## Como interpretar cada camada

### `.cursor/rules/`

Convenções persistentes de escrita, nomenclatura e comportamento do agente no projeto.

### `skills/`

Use esta camada para orientar implementação e revisão com segurança.

- Regras operacionais para painéis de configuração ficam em `skills/implementation/stack/SKILL.md`, junto com o stack e as referências obrigatórias.

### `architecture/`

Use esta camada para registrar decisões estruturais que valem para todo o sistema.

- Padrão oficial de painéis de configuração: `architecture/configuration-panels.md`.

### `vision/`

Use esta camada para explicar o que está sendo construído e como isso ajuda a operação.

## Regra de conflito

- Documentação fora destas pastas (anexos, planilhas ou notas externas ao repositório) não redefine `skills/` nem `architecture/`.
