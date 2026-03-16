# Modelo econômico

A saída econômica deve nascer primeiro no nível diário e depois ser agregada.

## Regra de moeda

- o fato econômico é armazenado apenas na moeda local da operação;
- a moeda local é resolvida a partir do país persistido ou do contexto persistido da operação;
- nenhuma taxa de câmbio é persistida no fato econômico;
- nenhum valor convertido é persistido no fato econômico;
- a conversão para outra moeda acontece apenas na camada de consulta ou relatório, usando o timestamp do registro e a moeda solicitada pelo usuário;
- o histórico financeiro auditável é apenas o fato em moeda local;
- relatório convertido é visão apresentacional e não substitui o fato local auditado.

## Medida central

- referência diária de preço;
- faturamento diário;
- custo diário;
- custo por item;
- custo por unidade comercial;
- custo por unidade vendável;
- margem bruta;
- lucro operacional.

A ausência dessa camada é uma das principais lacunas identificadas no planejamento.
