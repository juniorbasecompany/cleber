# Filtro e recorte

Filtro e recorte comuns:

- 'item'
- 'segmento'
- 'hierarquia de local'
- 'categoria'
- 'classificação'
- 'camada de cenário'
- 'intervalo de data'
- 'período'

## Regras

- o filtro de data opera sempre sobre o fato diário;
- total por período é derivado, nunca armazenado manualmente como verdade independente;
- o filtro de período deve declarar a granularidade permitida: 'dia', 'mês', 'ano' ou 'período personalizado';
- o filtro por 'classificação' deve funcionar sem obrigar a criação artificial de um novo 'segmento';
- o filtro por hierarquia de local deve respeitar a consolidação por nível.

## Filtro mínimo para painel avícola por período

- 'lote'
- 'segmento'
- 'empresa'
- 'local'
- 'classificação'
- 'período'

## Exemplo concreto

- filtrar 'lote' e 'mês' deve recalcular a visão derivada a partir da base diária;
- filtrar 'classificação = fêmea' não muda a verdade do 'segmento', apenas o recorte analítico;
- filtrar um nível da hierarquia de local deve consolidar automaticamente o nível filho.
