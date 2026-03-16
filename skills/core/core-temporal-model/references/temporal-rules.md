# Regra temporal

Regra temporal central:

- todo cálculo é diário;
- qualquer visão semanal, mensal, anual ou por período personalizado deriva do fato diário;
- idade, estágio fenológico, safra e janela operacional são resolvidos para o dia e não criam grão nativo separado;
- a vigência de parâmetro começa na data do evento e dura até o próximo evento do mesmo tipo ou até o fim do ciclo de vida da entidade;
- o resultado passado deve ser reconstruível a partir da regra e do evento válidos naquele momento;
- a persistência de back-end usa timestamp em UTC;
- front-end e relatório podem renderizar data e hora no fuso horário local do usuário ou da operação.

## Campo temporal obrigatório

- data de vigência;
- timestamp do evento;
- versão;
- origem;
- identificador do ator ou do processo, quando disponível.

## Nota

- persistência em UTC não muda a regra de que o grão de negócio continua sendo o dia;
- a lógica semanal continua sendo agregação de relatório, e não camada operacional;
- referência temporal de negócio pode afetar o resultado do dia, mas deve ser modelada como estado governado resolvido naquela data.
