---
name: metadata-governance
description: Use quando definir ou revisar atributo configurável, classificação, regra, rótulo por localidade, sobrescrita por país, unidade, agregação e catálogo governado de nicho sem fixar coluna de domínio no núcleo.
---

# Governança de metadado

Use esta skill quando a tarefa envolver a camada semântica configurável.

Leia estas referências conforme necessário:
- 'references/attribute-contract.md'
- 'references/rule-catalog.md'
- 'references/aggregation-rules.md'

## Fluxo

1. Identifique quais conceito são estruturais e quais são configuráveis.
2. Defina o contrato semântico mínimo de cada atributo.
3. Mantenha a estrutura fixa no núcleo e mova a semântica de nicho para metadado configurável governado.
4. Governe regra permitida, fórmula, origem, agregação e sobrescrita por país.
5. Suporte rótulo traduzido sem alterar chave técnica estável.
6. Suporte mais de um eixo de classificação sobre a mesma entidade quando o nicho precisar disso.
7. Mantenha pacote de nicho sobre essa camada de metadado.

## Restrições

- Evite coluna fixa para métrica de domínio por padrão.
- Evite EAV irrestrito e sem contrato semântico.
- Mantenha fórmula e agregação governadas, e não como texto arbitrário.
- Não colapse múltiplo eixo de classificação em um único campo improvisado.
- Não transforme qualidade, capacidade ou indicador de nicho em coluna rígida do núcleo por padrão.

## Idioma e nomenclatura

- Use inglês para todo elemento de código e estrutura técnica do projeto, incluindo nome de variável, função, método, classe, tabela, coluna, atributo, parâmetro, constante e qualquer outro identificador.
- Use português para comentário e explicação escrita dentro do código.
- Use português no conteúdo textual dos arquivos Markdown.
- Em arquivo Markdown, preserve em inglês todo termo que representar elemento de código, identificador, estrutura técnica, comando ou exemplo de código.

## Entregáveis

- Contrato de atributo.
- Catálogo de regra governada e classificação.
- Política de agregação por papel do atributo.
