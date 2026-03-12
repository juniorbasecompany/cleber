# Plano de desenvolvimento

## 1. Objetivo

Transformar o modelo hoje operado em planilhas em um sistema robusto para previsão, acompanhamento do realizado e simulação da produção de ovos, com cálculo diário, rastreabilidade completa e visão consolidada por lote, segmento, local, período e empresa.

O sistema deve permitir:

- prever plantel, produção, qualidade e faturamento;
- registrar o realizado sem sobrescrever a previsão;
- comparar previsto x realizado x corrigido;
- simular cenários de alojamento, transferência, descarte, mortalidade, aproveitamento e preço;
- consolidar um, vários ou todos os lotes em qualquer recorte temporal.

## 2. Princípios do modelo

### 2.1 Cálculo diário

Toda apuração deve ser diária. Visões semanais, mensais, anuais ou por intervalo devem ser agregações do cálculo diário.

### 2.2 Vigência por evento

Os parâmetros não devem ser modelados como intervalos fechados previamente definidos. Cada valor passa a valer a partir da data do evento e permanece vigente até:

- o próximo evento do mesmo tipo; ou
- o encerramento do segmento ou lote.

Exemplo:

- mortalidade = 0,10% a partir de 01/01;
- em 05/01, mortalidade passa a 0,14%;
- logo, 0,10% vale de 01/01 até 04/01, e 0,14% vale de 05/01 em diante.

Esse mesmo raciocínio se aplica a aproveitamento, MI, ME, percentual de ovos >60g, peso médio, preço, capacidade e demais parâmetros técnicos ou econômicos.

### 2.3 Fallback por escopo

Os parâmetros devem ser resolvidos por hierarquia de escopo.

Ordem sugerida:

1. valor específico do segmento;
2. valor específico do lote;
3. valor específico do local;
4. valor padrão geral.

O motor sempre deve registrar qual origem foi usada no cálculo, para garantir auditoria e depuração.

### 2.4 Previsão e realizado separados

O realizado não substitui a previsão. Ele deve ser armazenado em camada própria para permitir:

- comparação entre previsto e realizado;
- análise de desvios;
- revisão de premissas;
- construção de histórico de performance.

## 3. Estrutura conceitual

## 3.1 Lote

Lote representa a unidade biológica e econômica principal.

Cada lote deve possuir, no mínimo:

- identificação;
- linhagem ou padrão genético;
- data de alojamento inicial;
- situação atual;
- capacidade planejada;
- parâmetros técnicos vinculados direta ou indiretamente.

## 3.2 Segmento do lote

O lote deve poder ser subdividido em segmentos operacionais.

Um segmento existe quando parte do lote:

- permanece em um local;
- é transferida para outro local;
- sofre descarte parcial;
- passa a ter comportamento distinto do restante do lote.

O cálculo diário deve ocorrer no nível do segmento. O lote consolidado é a soma de seus segmentos ativos em cada data.

## 3.3 Local

O local deve suportar hierarquia operacional, por exemplo:

- empresa;
- unidade;
- granja;
- núcleo;
- aviário;
- subdivisão.

Isso permite consolidar produção, ocupação e capacidade em diferentes níveis.

## 3.4 Tipos de ave e composições

O modelo deve permitir diferenças dentro do mesmo lote ou segmento, como:

- fêmeas e machos;
- aves brancas e vermelhas;
- outras classificações zootécnicas relevantes.

Essas classificações podem impactar curvas, mortalidade, produção, peso, aproveitamento e valor econômico.

## 4. Eventos do sistema

## 4.1 Eventos operacionais

Eventos operacionais alteram a composição física do sistema.

Exemplos:

- alojamento;
- transferência;
- unificação ou separação lógica;
- descarte parcial;
- encerramento do lote ou segmento;
- ajustes de quantidade.

## 4.2 Eventos de parâmetro

Eventos de parâmetro alteram a regra de cálculo a partir de uma data.

Exemplos:

- mortalidade prevista;
- curva de produção;
- aproveitamento;
- MI;
- ME;
- percentual de ovos >60g;
- peso médio do ovo;
- preço por classe;
- capacidade planejada;
- meta técnica;
- meta econômica.

Todos os eventos devem ser versionados, datados e auditáveis.

## 5. Motor de cálculo

## 5.1 Resolução diária

Para cada dia e para cada segmento ativo, o motor deve calcular:

- idade do segmento e do lote;
- quantidade inicial do dia;
- mortalidade ou perdas previstas;
- plantel final do dia;
- produção total prevista;
- produção aproveitável prevista;
- distribuição por classe de qualidade;
- peso médio ou massa produzida;
- valor econômico previsto;
- ocupação e capacidade do local.

## 5.2 Curvas por idade

As curvas padrão por idade devem ser a base do modelo técnico. Sobre elas incidem os eventos vigentes e os ajustes específicos.

Na prática, a produção não nasce de um valor fixo por lote, mas da combinação entre:

- idade;
- padrão genético ou categoria;
- premissas vigentes;
- eventos operacionais;
- parametrização específica.

## 5.3 Rastreabilidade do cálculo

Cada valor calculado deve ser explicável. O sistema deve permitir identificar:

- qual curva foi aplicada;
- qual parâmetro foi utilizado;
- qual escopo forneceu o parâmetro;
- quais eventos estavam vigentes na data;
- qual fórmula gerou o valor final.

Sem isso, o sistema perde confiança operacional.

## 6. Realizado e reconciliação

O sistema deve permitir registrar o realizado diário, por segmento ou por agregação operacional, incluindo:

- plantel real;
- produção total real;
- produção aproveitável real;
- MI real;
- ME real;
- percentual >60 real;
- peso real;
- faturamento real;
- perdas ou ocorrências relevantes.

A reconciliação deve mostrar pelo menos:

- previsto original;
- realizado;
- desvio absoluto;
- desvio percentual;
- previsão corrigida, quando adotada.

## 7. Indicadores obrigatórios

O sistema deve disponibilizar, no mínimo, os seguintes indicadores:

- plantel inicial e final;
- mortalidade diária e acumulada;
- produção total de ovos;
- produção aproveitável;
- MI;
- ME;
- percentual de ovos >60g;
- peso médio do ovo;
- ovos por ave alojada;
- faturamento previsto;
- faturamento realizado;
- ocupação por local;
- capacidade disponível;
- pirâmide etária;
- estabilidade mensal de produção;
- concentração de alojamentos, transferências e descartes.

## 8. Cronograma e simulação

O cronograma não deve ser apenas um cadastro de datas. Ele deve funcionar como ferramenta de decisão.

O sistema deve permitir simular cenários alterando:

- datas de alojamento;
- datas de transferência;
- datas de descarte;
- quantidades movimentadas;
- curvas de mortalidade;
- curvas de aproveitamento;
- preços;
- capacidade dos locais.

O objetivo da simulação é reduzir picos e vales, equilibrar a pirâmide etária, melhorar ocupação e estabilizar produção e faturamento.

## 9. Visões e relatórios

O sistema deve oferecer visões por:

- dia;
- semana;
- mês;
- ano;
- intervalo livre;
- lote;
- segmento;
- local;
- empresa;
- consolidado geral.

Relatórios e painéis mínimos:

- produção diária prevista;
- produção diária realizada;
- previsto x realizado;
- cronograma consolidado de alojamento, transferência e descarte;
- pirâmide etária;
- ocupação e capacidade por local;
- estabilidade mensal;
- evolução de preço e faturamento;
- alertas de desvio relevante.

## 10. Diretrizes de modelagem

### 10.1 Separar fatos de premissas

Eventos realizados, parâmetros previstos e resultados calculados devem ficar em camadas distintas. Misturar essas naturezas fragiliza auditoria e manutenção.

### 10.2 Nunca recalcular sem histórico

Mudanças em parâmetros precisam gerar nova vigência, não alteração destrutiva do passado.

### 10.3 Consolidar por soma, nunca por edição manual

Totais de lote, local, mês ou empresa devem ser derivados do cálculo diário e não mantidos manualmente em células de consolidação.

### 10.4 Preparar o modelo para múltiplas granularidades

Mesmo que a operação inicial use poucos níveis, o modelo já deve suportar crescimento de complexidade sem refatoração estrutural.

## 11. Fases de desenvolvimento

### Fase 1 — Cadastro estrutural

Implementar cadastros de:

- lote;
- segmento;
- local hierárquico;
- categoria ou tipo de ave;
- capacidade;
- curvas padrão;
- tipos de evento.

### Fase 2 — Motor de vigência e fallback

Implementar:

- eventos de parâmetro;
- resolução por data;
- fallback por escopo;
- trilha de auditoria da origem do valor.

### Fase 3 — Motor diário previsto

Implementar cálculo diário do previsto para:

- plantel;
- produção;
- qualidade;
- faturamento;
- ocupação.

### Fase 4 — Eventos operacionais e segmentação

Implementar:

- transferências;
- descartes parciais;
- segmentação do lote;
- consolidação automática.

### Fase 5 — Realizado e reconciliação

Implementar:

- entrada do realizado;
- previsto x realizado;
- desvio;
- revisão de premissas.

### Fase 6 — Simulação e cronograma

Implementar:

- cenários alternativos;
- redistribuição de alojamentos e descartes;
- análise de estabilidade e capacidade.

### Fase 7 — Painéis e gestão

Implementar dashboards, relatórios gerenciais, alertas e acompanhamento operacional.

## 12. Critérios de sucesso

O plano será considerado bem implementado quando o sistema:

- reproduzir a lógica operacional hoje observada nas planilhas;
- calcular diariamente com coerência técnica;
- explicar cada valor calculado;
- suportar segmentação, transferências e descartes parciais;
- separar claramente previsão, realizado e simulação;
- permitir consolidação confiável por qualquer recorte;
- reduzir dependência de planilhas paralelas;
- apoiar decisões de cronograma, ocupação e estabilidade produtiva.

## 13. Resultado esperado

Ao final, a empresa terá um sistema capaz de transformar conhecimento operacional hoje disperso em planilhas em um modelo único, auditável e escalável, preservando a lógica técnica do negócio e ampliando a capacidade de análise, simulação e decisão.
