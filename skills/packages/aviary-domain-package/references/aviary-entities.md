# Entidade avícola

Entidade e dimensão relevante do domínio:

- lote como unidade biológica e econômica principal;
- segmento como unidade operacional de cálculo;
- hierarquia de local de 'empresa' até 'subdivisão';
- classificação de domínio, como 'sexo', 'linhagem', 'sub-linhagem', 'cor' e 'fase produtiva'.

## Regra de segmento

Use 'segmento' quando parte do lote:

1. permanecer em outro 'local';
2. sofrer descarte parcial;
3. receber ajuste relevante de quantidade;
4. passar a ter comportamento técnico ou econômico diferente do restante.

## Critério objetivo

- o cálculo diário acontece no nível de 'segmento';
- o consolidado do lote é a soma do segmento ativo na data;
- divisão lógica e unificação lógica devem preservar histórico e rastreabilidade;
- se duas partes do lote passarem a usar curva, premissa ou destino diferente, elas não devem continuar no mesmo 'segmento'.

## Exemplo concreto

- transferência parcial de ave do aviário A para o aviário B cria outro 'segmento';
- descarte parcial que altera quantidade e comportamento futuro cria ou ajusta 'segmento';
- separação entre maioria e minoria com idade efetiva diferente pode exigir 'segmento' distinto quando a produção não puder ser acompanhada em conjunto.

## Regra de classificação

'classificação' representa eixo configurável que altera leitura, curva, cálculo ou agregação.

## Critério objetivo

- o sistema deve aceitar mais de um eixo de 'classificação' sobre a mesma entidade;
- uma 'classificação' só deve existir se impactar cálculo, filtro, painel ou rastreabilidade;
- composição multinível é válida quando um eixo depende de outro, como 'linhagem' e 'sub-linhagem';
- 'classificação' não substitui 'segmento': diferença de composição não cria novo 'segmento' por si só, a menos que altere comportamento operacional ou econômico.

## Exemplo concreto

- 'sexo': 'fêmea' e 'macho';
- 'cor': 'branca' e 'vermelha';
- 'linhagem' e 'sub-linhagem';
- 'fase produtiva': 'recria', 'produção' e 'muda forçada'.

Idade é tratada como atributo diário resolvido na data, e não como eixo temporal separado.
