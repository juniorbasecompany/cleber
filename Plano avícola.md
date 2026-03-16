# Plano de desenvolvimento

## 1. Objetivo

Transformar o modelo hoje operado em planilhas em um sistema robusto para previsÃ£o, acompanhamento do realizado e simulaÃ§Ã£o da produÃ§Ã£o de ovos, com cÃ¡lculo diÃ¡rio, rastreabilidade completa e visÃ£o consolidada por lote, segmento, local, perÃ­odo e empresa.

O sistema deve permitir:

- prever a operaÃ§Ã£o para avicultura fÃ©rtil e avicultura comercial;
- prever plantel, produÃ§Ã£o, qualidade e faturamento;
- suportar visÃ£o por granja, nÃºcleo, aviÃ¡rio, box, gaiola, lote e segmento, conforme o tipo de operaÃ§Ã£o;
- suportar classificaÃ§Ã£o por macho, fÃªmea, vermelha, branca, linhagem e sub-linhagem;
- suportar as fases da ave: cria, recria, produÃ§Ã£o e muda forÃ§ada;
- prever viabilidade, entendida como mortalidade e eliminaÃ§Ã£o com apuraÃ§Ã£o de aves vivas ao fim da fase;
- prever produÃ§Ã£o total de ovos;
- prever aproveitamento, entendendo aproveitamento como nÃºmero de ovos viÃ¡veis, vendÃ¡veis ou incubÃ¡veis;
- quantificar descartes para efeito de faturamento;
- registrar o realizado sem sobrescrever a previsÃ£o;
- suportar projeÃ§Ã£o em trÃªs camadas: previsto inflexÃ­vel, previsto ajustado ou corrigido pelo realizado e simulaÃ§Ã£o por variÃ¡veis independentes;
- comparar previsto x realizado x corrigido;
- simular cenÃ¡rios de alojamento, transferÃªncia, descarte, mortalidade, aproveitamento e preÃ§o;
- consolidar um, vÃ¡rios ou todos os lotes em qualquer recorte temporal.

## 2. PrincÃ­pios do modelo

### 2.1 CÃ¡lculo diÃ¡rio

Toda apuraÃ§Ã£o deve ser diÃ¡ria. VisÃµes diárias, mensais, anuais ou por intervalo devem ser agregaÃ§Ãµes do cÃ¡lculo diÃ¡rio.

### 2.2 VigÃªncia por evento

Os parÃ¢metros nÃ£o devem ser modelados como intervalos fechados previamente definidos. Cada valor passa a valer a partir da data do evento e permanece vigente atÃ©:

- o prÃ³ximo evento do mesmo tipo; ou
- o encerramento do segmento ou lote.

Exemplo:

- mortalidade = 0,10% a partir de 01/01;
- em 05/01, mortalidade passa a 0,14%;
- logo, 0,10% vale de 01/01 atÃ© 04/01, e 0,14% vale de 05/01 em diante.

Esse mesmo raciocÃ­nio se aplica a qualquer atributo configurÃ¡vel, tÃ©cnico ou econÃ´mico. Mortalidade, aproveitamento, MI, ME, faixas de peso, preÃ§o e capacidade sÃ£o apenas exemplos possÃ­veis do domÃ­nio.

### 2.3 Fallback por escopo

Os parÃ¢metros devem ser resolvidos por hierarquia de escopo.

Ordem sugerida:

1. valor especÃ­fico do segmento;
2. valor especÃ­fico do lote;
3. valor especÃ­fico do local;
4. valor padrÃ£o geral.

O motor sempre deve registrar qual origem foi usada no cÃ¡lculo, para garantir auditoria e depuraÃ§Ã£o.

### 2.4 PrevisÃ£o e realizado separados

O realizado nÃ£o substitui a previsÃ£o. Ele deve ser armazenado em camada prÃ³pria para permitir:

- comparaÃ§Ã£o entre previsto e realizado;
- anÃ¡lise de desvios;
- revisÃ£o de premissas;
- construÃ§Ã£o de histÃ³rico de performance.

### 2.5 Modelo orientado por metadado

O sistema deve ser orientado por metadado. Isso significa que atributos, classificaÃ§Ãµes, curvas, regras e indicadores de negÃ³cio nÃ£o devem nascer como colunas dedicadas por padrÃ£o.

Deve existir uma distinÃ§Ã£o clara entre:

- estrutura fixa do sistema, responsÃ¡vel por identidade, relacionamento, escopo, vigÃªncia, auditoria, versionamento e materializaÃ§Ã£o;
- conteÃºdo configurÃ¡vel, responsÃ¡vel por definir atributos, classificaÃ§Ãµes, fÃ³rmulas, unidades, agregaÃ§Ãµes e rÃ³tulos exibidos ao usuÃ¡rio.

Assim, itens como mortalidade, aproveitamento, MI, ME, percentual de ovos >60g, peso mÃ©dio e preÃ§o devem ser tratados como exemplos de atributos configurÃ¡veis do domÃ­nio, e nÃ£o como nomes obrigatÃ³rios de colunas fÃ­sicas.

No contexto avÃ­cola, termos como lote, alojamento, aviÃ¡rio, mortalidade, produÃ§Ã£o, aproveitamento e classificaÃ§Ã£o de ovo devem ser entendidos como parte do pacote analÃ­tico do nicho, e nÃ£o como imposiÃ§Ã£o estrutural da base fÃ­sica do sistema.

Cada atributo configurÃ¡vel deve permitir, no mÃ­nimo:

- nome exibido ao usuÃ¡rio;
- tipo do valor;
- papel no cÃ¡lculo;
- granularidade;
- regra de agregaÃ§Ã£o;
- vigÃªncia;
- origem permitida;
- unidade e precisÃ£o;
- fÃ³rmula ou referÃªncia de cÃ¡lculo, quando aplicÃ¡vel.

As regras disponÃ­veis para o nicho avÃ­cola devem ser governadas, para evitar tanto rigidez estrutural quanto liberdade excessiva sem semÃ¢ntica operacional.

### 2.6 Temporalidade e histÃ³rico imutÃ¡vel

Toda informaÃ§Ã£o com efeito operacional deve considerar vigÃªncia temporal e histÃ³rico imutÃ¡vel.

O plano deve preservar, no mÃ­nimo:

- data em que o valor passa a valer;
- versÃ£o da regra, do evento ou do cÃ¡lculo;
- origem do dado;
- possibilidade de reconstruir o cÃ¡lculo de uma data passada com base nas regras vigentes naquele momento.

### 2.7 Moeda local e conversão de relatório

Toda informação financeira auditável deve ser persistida apenas na moeda local da operação.

Isso significa, no mínimo:

- valor econômico original em moeda local;
- auditoria e reconstrução histórica apenas sobre o fato local;
- possibilidade de exibir relatórios em outra moeda por conversão na consulta;
- conversão cambial tratada como recurso de visualização, e não como parte do fato financeiro auditável.

Se a taxa histórica usada em relatório convertido mudar posteriormente, isso não altera o fato financeiro original nem a auditoria operacional da moeda local.

### 2.8 UTC no backend e exibição local

O sistema deve persistir timestamps em UTC e exibir datas e horários no timezone local da operação ou do usuário, conforme a necessidade da interface.

Isso não altera o princípio central do modelo:

- o grão operacional continua sendo o dia;
- relatórios diários, mensais, anuais ou por período continuam sendo agregações da base diária.

### 2.9 País opcional no escopo

O país deve ser suportado como nível opcional da hierarquia de local.

Quando ele não for necessário para a operação, pode ser omitido.

Quando o fato envolver valor econômico, o país precisa estar resolvido no contexto persistido da operação para determinar a moeda local do registro.

## 3. Estrutura conceitual

## 3.1 Lote

Lote representa a unidade biolÃ³gica e econÃ´mica principal.

Cada lote deve possuir, no mÃ­nimo:

- identificaÃ§Ã£o;
- linhagem ou padrÃ£o genÃ©tico;
- data de alojamento inicial;
- parÃ¢metros tÃ©cnicos vinculados direta ou indiretamente.

## 3.2 Segmento do lote

O lote deve poder ser subdividido em segmentos operacionais.

Um segmento existe quando parte do lote:

- permanece em um local;
- Ã© transferida para outro local;
- sofre descarte parcial;
- passa a ter comportamento distinto do restante do lote.

Ao alocar um lote, normalmente vindo da cria ou recria, deve-se dar sequÃªncia na idade ponderada dos lotes precedentes, usando o standard daquele que estiver em maioria ou mantendo ambos, caso seja possÃ­vel acompanhar a produÃ§Ã£o de forma separada.

O cÃ¡lculo diÃ¡rio deve ocorrer no nÃ­vel do segmento. O lote consolidado Ã© a soma de seus segmentos ativos em cada data.

## 3.3 Local

O local deve suportar hierarquia operacional, por exemplo:

- país, quando aplicável;
- empresa;
- unidade;
- granja;
- núcleo;
- aviário;
- subdivisão.

Os níveis intermediários devem ser opcionais, para não engessar operações pequenas.

Isso permite consolidar produção, ocupação e capacidade em diferentes níveis.
## 3.4 ClassificaÃ§Ãµes e composiÃ§Ãµes

O modelo deve permitir diferenÃ§as dentro do mesmo lote ou segmento, como:

- fÃªmeas e machos;
- aves brancas e vermelhas;
- outras classificaÃ§Ãµes zootÃ©cnicas relevantes, incluindo linhagem e sub-linhagem.

Essas classificaÃ§Ãµes podem impactar curvas, atributos tÃ©cnicos, produÃ§Ã£o, peso, aproveitamento e valor econÃ´mico.

As classificaÃ§Ãµes devem ser configurÃ¡veis, podendo ser definidas pelo usuÃ¡rio sem alteraÃ§Ã£o de schema. O sistema deve suportar mais de um eixo de classificaÃ§Ã£o sobre a mesma entidade, inclusive com composiÃ§Ã£o multinÃ­vel quando necessÃ¡rio.

## 3.5 Atributo

Atributo representa qualquer medida, parÃ¢metro, indicador, restriÃ§Ã£o ou variÃ¡vel de negÃ³cio definida pelo usuÃ¡rio.

O atributo nÃ£o deve depender de coluna dedicada para existir. Seu comportamento deve ser definido por cadastro, incluindo tipo, escopo, vigÃªncia, fÃ³rmula, agregaÃ§Ã£o e forma de exibiÃ§Ã£o.

No nicho avÃ­cola, isso inclui atributos como mortalidade, produÃ§Ã£o, aproveitamento, MI, ME, percentual por classe, peso, preÃ§o e capacidade, sempre tratados como conteÃºdo configurÃ¡vel.

## 3.6 Regra

Regra representa a forma como um atributo Ã© tratado pelo motor.

Uma regra pode definir, por exemplo:

- como o valor Ã© informado;
- como ele Ã© resolvido por escopo;
- como ele Ã© agregado;
- se ele participa de cÃ¡lculo derivado;
- se ele Ã© previsto, realizado, simulado ou calculado.

## 3.7 Medida diÃ¡ria materializada

Toda saÃ­da relevante do motor deve ser persistida como medida diÃ¡ria materializada.

Essa medida deve permitir rastrear, no mÃ­nimo:

- entidade calculada;
- data;
- atributo;
- valor;
- classificaÃ§Ã£o aplicada, quando houver;
- origem;
- versÃ£o do cÃ¡lculo.

## 4. Eventos do sistema

## 4.1 Eventos operacionais

Eventos operacionais alteram a composiÃ§Ã£o fÃ­sica do sistema.

Exemplos:

- alojamento;
- transferÃªncia;
- unificaÃ§Ã£o ou separaÃ§Ã£o lÃ³gica;
- descarte parcial;
- encerramento do lote ou segmento;
- ajustes de quantidade.

## 4.2 Eventos de atributo e regra

Eventos de atributo alteram o valor vigente de um atributo configurÃ¡vel a partir de uma data.

Eventos de regra alteram a forma de tratamento de um atributo, como fÃ³rmula, agregaÃ§Ã£o, fallback, unidade operacional ou comportamento no cÃ¡lculo.

Exemplos de atributos que podem ser governados por esses eventos incluem mortalidade, curva de produÃ§Ã£o, aproveitamento, MI, ME, percentual de ovos >60g, peso mÃ©dio do ovo, preÃ§o por classe, capacidade planejada, meta tÃ©cnica e meta econÃ´mica. Esses exemplos nÃ£o devem ser interpretados como uma lista fechada.

A taxonomia de eventos e regras do nicho avÃ­cola deve ser configurÃ¡vel e governada, mesmo quando o vocabulÃ¡rio operacional jÃ¡ estiver estabilizado.

Todos os eventos devem ser versionados, datados, auditÃ¡veis e reconstruÃ­veis historicamente.

## 5. Motor de cÃ¡lculo

## 5.1 ResoluÃ§Ã£o diÃ¡ria

Para cada dia e para cada segmento ativo, o motor deve:

- identificar os atributos vigentes para a data e para o escopo aplicÃ¡vel;
- resolver classificaÃ§Ãµes e composiÃ§Ãµes relevantes;
- aplicar fallback por escopo;
- calcular atributos derivados;
- persistir o resultado em medida diÃ¡ria materializada;
- registrar a proveniÃªncia de cada valor calculado.

Entre os atributos que podem ser resolvidos por esse mecanismo estÃ£o, por exemplo, idade, quantidade inicial do dia, perdas previstas, plantel final do dia, produÃ§Ã£o total, produÃ§Ã£o aproveitÃ¡vel, distribuiÃ§Ã£o por classe, peso, massa produzida, valor econÃ´mico, ocupaÃ§Ã£o e capacidade. Esses itens sÃ£o exemplos de uso do motor, nÃ£o uma lista fixa de colunas.

## 5.2 Curvas por idade resolvida no dia

As curvas padrÃ£o por idade devem ser a base do modelo tÃ©cnico. A idade deve ser resolvida como atributo do dia, e nÃ£o como eixo temporal separado do cÃ¡lculo. Sobre ela incidem os eventos vigentes e os ajustes especÃ­ficos.

A idade inicial de cada lote pode ser arbitrÃ¡ria, quando necessÃ¡rio.

Na prÃ¡tica, a produÃ§Ã£o nÃ£o nasce de um valor fixo por lote, mas da combinaÃ§Ã£o entre:

- idade;
- padrÃ£o genÃ©tico ou categoria;
- premissas vigentes;
- eventos operacionais;
- parametrizaÃ§Ã£o especÃ­fica.

O eixo temporal do cÃ¡lculo continua sendo sempre o dia. Idade, fase produtiva e demais referÃªncias tÃ©cnicas entram como atributos, classificaÃ§Ãµes ou regras aplicadas ao dia calculado.

## 5.3 Rastreabilidade do cÃ¡lculo

Cada valor calculado deve ser explicÃ¡vel. O sistema deve permitir identificar:

- qual curva foi aplicada;
- qual atributo foi utilizado;
- qual escopo forneceu o parÃ¢metro;
- quais eventos estavam vigentes na data;
- qual fÃ³rmula gerou o valor final.

Sem isso, o sistema perde confianÃ§a operacional.

## 5.4 Fatos diÃ¡rios materializados

O cÃ¡lculo diÃ¡rio deve gerar fatos materializados por dia, persistidos de forma consultÃ¡vel e versionÃ¡vel.

Esses fatos devem:

- ser a base para visÃµes diárias, mensais, anuais e por intervalo;
- evitar dependÃªncia de colunas fixas de indicador de negÃ³cio;
- permitir reprocessamento sem destruiÃ§Ã£o do histÃ³rico anterior;
- armazenar entidade, data, atributo, valor, origem, versÃ£o e classificaÃ§Ã£o aplicÃ¡vel.

## 6. Realizado e reconciliaÃ§Ã£o

O sistema deve permitir registrar o realizado diÃ¡rio, por segmento ou por agregaÃ§Ã£o operacional, usando o mesmo catÃ¡logo de atributo sempre que fizer sentido.

O realizado deve suportar:

- atributo informado manualmente;
- atributo importado;
- atributo conciliado com o previsto;
- ocorrÃªncia operacional relevante ligada ao dia, ao segmento, ao lote, ao local ou Ã  classificaÃ§Ã£o.

A reconciliaÃ§Ã£o deve mostrar pelo menos:

- valor previsto original;
- valor realizado;
- desvio absoluto;
- desvio percentual;
- previsÃ£o corrigida, quando adotada.

A comparaÃ§Ã£o deve ocorrer entre atributos equivalentes por regra, e nÃ£o entre um conjunto fixo de colunas.

## 7. Capacidades mÃ­nimas de indicador

O sistema deve disponibilizar, no mÃ­nimo, as seguintes capacidades:

- cadastrar atributo de negÃ³cio sem mudanÃ§a de schema;
- cadastrar indicador derivado por fÃ³rmula;
- consolidar por lote, segmento, local, empresa, classificaÃ§Ã£o e perÃ­odo;
- comparar previsto, realizado, corrigido e simulado;
- agregar por soma, mÃ©dia, Ãºltimo valor, mÃ©dia ponderada, mÃ¡ximo ou mÃ­nimo, conforme regra do atributo;
- rastrear origem, vigÃªncia, escopo e fÃ³rmula aplicada.

Indicadores como plantel inicial e final, mortalidade diÃ¡ria e acumulada, produÃ§Ã£o total de ovos, produÃ§Ã£o aproveitÃ¡vel, MI, ME, percentual de ovos >60g, peso mÃ©dio do ovo, ovos por ave alojada, faturamento, ocupaÃ§Ã£o, capacidade, pirÃ¢mide etÃ¡ria, estabilidade mensal e concentraÃ§Ã£o de alojamentos sÃ£o exemplos iniciais do domÃ­nio, e nÃ£o estrutura fixa obrigatÃ³ria do banco.

No nicho avÃ­cola, esse conjunto pode compor o pacote analÃ­tico inicial, mas deve continuar sendo evolutivo e governado por metadado.

## 8. Cronograma e simulaÃ§Ã£o

O cronograma nÃ£o deve ser apenas um cadastro de datas. Ele deve funcionar como ferramenta de decisÃ£o.

O sistema deve permitir simular cenÃ¡rios alterando:

- datas de alojamento;
- datas de transferÃªncia;
- datas de descarte;
- quantidades movimentadas;
- curvas de mortalidade;
- curvas de aproveitamento;
- preÃ§os;
- capacidade dos locais.

O objetivo da simulaÃ§Ã£o Ã© reduzir picos e vales, equilibrar a pirÃ¢mide etÃ¡ria, melhorar ocupaÃ§Ã£o e estabilizar produÃ§Ã£o e faturamento, inclusive para apoio ao PCP.

## 9. Visões e relatórios

O sistema deve oferecer visões por:

- dia;
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
- alertas de desvio relevante;
- visão por período formal derivada da base diária, quando exigida pelo painel gerencial.

Relatórios financeiros exibidos em moeda diferente da moeda local devem ser tratados como visões derivadas para análise, e não como substituição do fato financeiro auditável.
## 10. Diretrizes de modelagem

### 10.1 Separar fatos de premissas

Eventos realizados, parÃ¢metros previstos e resultados calculados devem ficar em camadas distintas. Misturar essas naturezas fragiliza auditoria e manutenÃ§Ã£o.

### 10.2 Nunca recalcular sem histÃ³rico

MudanÃ§as em parÃ¢metros precisam gerar nova vigÃªncia, nÃ£o alteraÃ§Ã£o destrutiva do passado.

### 10.3 Consolidar por soma, nunca por ediÃ§Ã£o manual

Totais de lote, local, mÃªs ou empresa devem ser derivados do cÃ¡lculo diÃ¡rio e nÃ£o mantidos manualmente em cÃ©lulas de consolidaÃ§Ã£o.

### 10.4 Preparar o modelo para mÃºltiplas granularidades

Mesmo que a operaÃ§Ã£o inicial use poucos nÃ­veis, o modelo jÃ¡ deve suportar crescimento de complexidade sem refatoraÃ§Ã£o estrutural.

### 10.5 Modelagem hÃ­brida em PostgreSQL

O modelo deve usar PostgreSQL com abordagem hÃ­brida:

- tabelas relacionais para a espinha dorsal do sistema;
- JSONB para classificaÃ§Ã£o variÃ¡vel, propriedade opcional e configuraÃ§Ã£o flexÃ­vel;
- vigÃªncia temporal para resolver valor efetivo ao longo do tempo;
- fatos diÃ¡rios materializados para consulta analÃ­tica e consolidaÃ§Ã£o.

Essa abordagem deve ser orientada por metadado, mas sem cair em EAV puro e indiscriminado.

A camada relacional deve concentrar identidade, relacionamento, escopo, evento, vigÃªncia, versÃ£o, auditoria e integridade.

O uso de JSONB deve ser controlado. Ele nÃ£o deve substituir chave essencial de negÃ³cio, integridade referencial nem filtro recorrente sem estratÃ©gia clara de indexaÃ§Ã£o e governanÃ§a.

### 10.6 ConvenÃ§Ã£o fÃ­sica do banco

Os nomes fÃ­sicos do banco devem seguir as seguintes regras:

- tabela em inglÃªs;
- coluna em inglÃªs;
- tudo no singular;
- tudo com uma Ãºnica palavra;
- sem underline;
- sem camelCase.

Os atributos definidos pelo usuÃ¡rio devem ser apresentados em portuguÃªs e podem usar mais de uma palavra.

O modelo deve separar nome tÃ©cnico interno de rÃ³tulo exibido ao usuÃ¡rio.

### 10.7 Pacote analÃ­tico avÃ­cola

O nicho avÃ­cola deve ser tratado como um pacote configurÃ¡vel sobre o nÃºcleo comum do sistema.

Esse pacote pode reunir, por exemplo:

- terminologia exibida ao usuÃ¡rio;
- catÃ¡logo inicial de atributo;
- classificaÃ§Ã£o zootÃ©cnica;
- catÃ¡logo de evento operacional;
- conjunto de fÃ³rmula;
- validaÃ§Ãµes do domÃ­nio;
- painel e relatÃ³rio padrÃ£o.

Isso permite preservar a aderÃªncia ao negÃ³cio de aves sem transformar o nÃºcleo em uma estrutura exclusiva para avicultura.

## 11. Fases de desenvolvimento

### Fase 1 â€” Cadastro estrutural

Implementar cadastros de:

- lote;
- segmento;
- local hierÃ¡rquico;
- classificaÃ§Ã£o configurÃ¡vel;
- atributo configurÃ¡vel;
- regra;
- tipo de evento.

### Fase 2 â€” Motor de vigÃªncia e fallback

Implementar:

- eventos de atributo e regra;
- resoluÃ§Ã£o por data;
- fallback por escopo;
- trilha de auditoria da origem do valor.

### Fase 3 â€” Motor diÃ¡rio materializado

Implementar cÃ¡lculo diÃ¡rio materializado para:

- atributos previstos;
- atributos derivados;
- consolidaÃ§Ã£o diÃ¡ria;
- versionamento do cÃ¡lculo;
- persistÃªncia dos fatos diÃ¡rios.

### Fase 4 â€” Eventos operacionais e segmentaÃ§Ã£o

Implementar:

- transferÃªncias;
- descartes parciais;
- segmentaÃ§Ã£o do lote;
- consolidaÃ§Ã£o automÃ¡tica.

### Fase 5 â€” Realizado e reconciliaÃ§Ã£o

Implementar:

- entrada do realizado por atributo;
- previsto x realizado;
- desvio;
- revisÃ£o de premissa.

### Fase 6 â€” SimulaÃ§Ã£o e cronograma

Implementar:

- cenÃ¡rios alternativos;
- redistribuiÃ§Ã£o de alojamentos e descartes;
- anÃ¡lise de estabilidade e capacidade.

### Fase 7 â€” PainÃ©is e gestÃ£o

Implementar dashboards, relatÃ³rios gerenciais, alertas e acompanhamento operacional.

## 12. CritÃ©rios de sucesso

O plano serÃ¡ considerado bem implementado quando o sistema:

- reproduzir a lÃ³gica operacional hoje observada nas planilhas;
- calcular diariamente com coerÃªncia tÃ©cnica;
- explicar cada valor calculado;
- permitir criar novo atributo de negÃ³cio sem mudanÃ§a de schema;
- suportar segmentaÃ§Ã£o, agrupamento, transferÃªncias e descartes parciais;
- separar claramente previsÃ£o, realizado e simulaÃ§Ã£o;
- permitir consolidaÃ§Ã£o confiÃ¡vel por qualquer recorte;
- eliminar dependÃªncia de planilhas paralelas;
- apoiar decisÃµes de cronograma, ocupaÃ§Ã£o e estabilidade produtiva.

## 13. Resultado esperado

Ao final, a empresa terÃ¡ um sistema capaz de transformar conhecimento operacional hoje disperso em planilhas em um modelo Ãºnico, auditÃ¡vel e escalÃ¡vel, preservando a lÃ³gica tÃ©cnica do negÃ³cio e ampliando a capacidade de anÃ¡lise, simulaÃ§Ã£o e decisÃ£o.

