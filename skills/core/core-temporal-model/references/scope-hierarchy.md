# Hierarquia de escopo

Regra canônica de resolução:

1. valor específico do segmento;
2. valor específico do item;
3. nó de local mais específico;
4. nó pai na hierarquia de local;
5. valor específico do país;
6. padrão global.

## Requisito

- o país é um nó opcional da hierarquia de local, e não um mecanismo paralelo separado;
- operação pequena pode omitir nível intermediário que não utiliza;
- todo valor resolvido deve registrar qual escopo o forneceu;
- a ordem de fallback sempre vai do escopo mais específico resolvido ao menos específico.
