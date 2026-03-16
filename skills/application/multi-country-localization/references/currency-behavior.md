# Comportamento de moeda

Regra de moeda para este projeto:

- cada país tem uma moeda local;
- o fato econômico é persistido apenas na moeda local;
- o fato não armazena taxa de câmbio;
- o fato não armazena valor convertido;
- o fato não precisa armazenar separadamente a moeda de origem se o país persistido já a resolver;
- o registro financeiro auditável é sempre o fato em moeda local.

Isso mantém o fato de origem pequeno e estável.
