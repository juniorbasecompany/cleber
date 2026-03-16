# Fonte oficial

## Regra geral

A documentação do projeto tem autoridade explícita por camada.

1. 'skills/' é a verdade operacional.
2. 'architecture/' é a verdade decisória curta.
3. 'vision/' é a explicação humana da solução.
4. 'reference/' é material de consulta.
5. 'archive/' é material histórico e superado.

## Como interpretar cada camada

### 'skills/'

Use esta camada quando a pergunta for: como isso deve ser implementado ou revisado com segurança?

### 'architecture/'

Use esta camada quando a pergunta for: qual decisão estrutural vale para todo o sistema?

### 'vision/'

Use esta camada quando a pergunta for: o que estamos construindo e como isso ajuda a operação?

### 'reference/'

Use esta camada quando a pergunta for: qual contexto, exemplo, plano anterior ou material-fonte ajuda a entender melhor?

### 'archive/'

Use esta camada apenas para recuperar histórico, comparar pensamento anterior ou rastrear decisão superada.

## Regra de conflito

- 'reference/' não redefine 'skills/' nem 'architecture/'.
- 'archive/' não deve orientar decisão nova sem promoção explícita.
- Quando um detalhe importante existir apenas em 'reference/', ele deve ser promovido para 'skills/' ou 'architecture/' antes de virar base oficial.
