# Princípios do sistema

## Decisões permanentes

- O grão nativo de cálculo do sistema é diário.
- Mudança de comportamento entra por evento, com vigência a partir de uma data.
- O histórico operacional deve ser rastreável e reconstruível.
- O núcleo estrutural é compartilhado entre nichos.
- A arquitetura separa estrutura fixa de conteúdo configurável.
- A estrutura fixa concentra identidade, relacionamento, escopo, vigência, auditoria, versionamento, fato diário materializado e integridade.
- O conteúdo configurável concentra atributo, classificação, catálogo de evento, fórmula, agregação, unidade, terminologia exibida e pacote analítico do nicho.
- O vocabulário, o indicador, a validação e a fórmula de cada nicho ficam em pacote próprio.
- O sistema é orientado por metadado governado, e não por coluna fixa de domínio.
- Referência temporal de negócio, como idade, estágio, safra e janela operacional, entra como atributo, classificação ou regra resolvida no dia, e não como eixo nativo separado.
- Qualidade, capacidade e indicador de nicho são conceito configurável e governado, e não campo rígido do núcleo.
- O sistema deve suportar mais de um eixo de classificação sobre a mesma entidade quando o nicho exigir.
- O fato econômico auditável é persistido apenas na moeda local da operação.
- Conversão cambial existe apenas em consulta ou relatório.
- Timestamp é persistido em UTC e exibido no contexto local.
- País pode existir no escopo quando necessário, sem virar rigidez estrutural para todo fluxo.
- Texto exibido ao usuário deve ser governado por metadado ou catálogo de mensagem com chave técnica estável e resolução contextual no momento da exibição.
- A resolução contextual de texto deve seguir a ordem oficial de fallback: país, local, usuário.
- Painel e visão por período devem nascer da base diária oficial, nunca de número paralelo sem proveniência.

## Limites que não devem ser rompidos

- O núcleo não deve ser contaminado por vocabulário específico de um nicho.
- JSONB pode apoiar flexibilidade, mas não substitui semântica estrutural nem governança.
- O modelo não deve assumir que toda entidade tenha semântica específica de um único nicho.
- Realizado não sobrescreve previsto.
- Simulação não altera histórico de produção.
- Material de referência não substitui decisão arquitetural nem contrato operacional.
