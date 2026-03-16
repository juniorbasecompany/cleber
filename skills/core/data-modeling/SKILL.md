---
name: data-modeling
description: Use quando desenhar ou revisar modelo de dados relacional com rigor arquitetural: entidade, atributo, relacionamento, PK, FK, normalização, índice, uso criterioso de JSON, modelo lógico e modelo físico PostgreSQL.
---

# Modelagem de dados

Use esta skill quando a tarefa exigir desenho estrutural de banco de dados com clareza semântica, consistência relacional e decisão explícita de trade-off.

Leia estas referências conforme necessário:
- 'references/er-model.html'

## Fluxo

1. Delimite o domínio e questione premissa ambígua antes de propor tabela ou coluna.
2. Identifique entidade principal, identidade, ciclo de vida e vigência.
3. Defina atributo por entidade com tipo, nulabilidade, unidade, precisão e exemplo de valor.
4. Modele relacionamento com cardinalidade, opcionalidade e regra de integridade.
5. Defina `primary key`, `foreign key`, `unique key`, `check` e restrição temporal quando necessário.
6. Aplique normalização até o ponto em que a semântica estrutural fique clara sem comprometer a leitura operacional.
7. Decida índice a partir de acesso, seletividade, volume e padrão de filtro, e não por hábito.
8. Use coluna relacional para dado que participa de integridade, filtro, `join`, vigência ou auditabilidade.
9. Use `JSONB` apenas para carga flexível, explicação, contrato variável ou detalhe secundário que não substitua semântica estrutural.
10. Entregue o modelo lógico e depois o modelo físico para PostgreSQL com tipo, índice, partição e observação de performance.

## Restrições

- Não escolha tabela, coluna ou relacionamento por conveniência visual.
- Não use `JSONB` como atalho para evitar modelagem relacional.
- Não persista valor derivado como verdade oficial sem origem e proveniência explícitas.
- Não misture núcleo estrutural, metadado configurável e camada analítica sem fronteira clara.
- Não use nome técnico em plural, exceto quando estritamente necessário.
- Não proponha índice sem explicar o padrão de consulta que o justifica.
- Não trate o modelo físico como mero espelho automático do modelo conceitual; ajuste para volume, auditoria e operação.

## Idioma e nomenclatura

- Use inglês para nome técnico de `table`, `column`, `constraint`, `index`, `view` e qualquer outro identificador estrutural.
- Use português para explicação arquitetural em Markdown.
- Use nome técnico no singular como padrão.
- Use sufixo `list` apenas quando um exemplo realmente representar coleção.

## Entregáveis

- Lista de entidade.
- Descrição de cada entidade.
- Relação entre entidade com cardinalidade.
- Esquema de tabela proposto com coluna, tipo, `primary key`, `foreign key`, nulabilidade e exemplo.
- Observação de arquitetura com normalização, índice, uso de `JSONB` e trade-off físico no PostgreSQL.

## Formato de saída sugerido

- `lista de entidade`
- `descrição de cada entidade`
- `relações entre entidade`
- `esquema de tabela proposto`
- `observações de arquitetura`
