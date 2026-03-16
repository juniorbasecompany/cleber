# País no escopo

Comportamento de país para este projeto:

- o país é um nó opcional na hierarquia de local;
- o contexto do usuário pode sugerir país na interface, mas não deve definir sozinho o histórico econômico persistido;
- para qualquer fato econômico, o país resolvido deve vir do contexto operacional armazenado;
- o fallback pode resolver valor por país quando existir padrão nacional.

## Ordem canônica de especificidade

1. segmento
2. item
3. nó de local mais específico
4. nó pai da hierarquia de local
5. país
6. global

Operação pequena pode omitir nível intermediário que não utiliza.
