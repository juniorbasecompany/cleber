# Conversão para relatório

Regra de relatório em múltipla moeda:

- a conversão existe apenas durante a execução da consulta ou do relatório;
- a conversão usa o timestamp do registro;
- a conversão usa a moeda local implícita pelo país persistido do registro;
- a conversão usa a moeda de destino solicitada pelo usuário no momento da visualização;
- o relatório convertido é apenas uma visão apresentacional;
- o relatório convertido não substitui nem altera o fato auditável em moeda local.

## Implicação

- o relatório convertido pode variar se a fonte de câmbio alterar sua série histórica;
- isso não afeta a auditabilidade do fato financeiro em moeda local.
