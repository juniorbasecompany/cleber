# Plano: implementação de i18n

Este ficheiro é um **plano de trabalho volátil**. A política estável de i18n continua em [skills/implementation/i18n/policy.md](../../skills/implementation/i18n/policy.md), e a instrução operacional do agente fica em [skills/implementation/i18n/SKILL.md](../../skills/implementation/i18n/SKILL.md).

## Fase 0 — Acordo

- [ ] Definir locales iniciais (ex.: `pt-BR` apenas na primeira entrega).
- [ ] Confirmar `next-intl` e o local de `messages/`.
- [ ] Fechar a convenção de chaves e namespaces.

## Fase 1 — Fundação

- [ ] Integrar i18n no layout e nas páginas novas.
- [ ] Garantir que strings novas entram por chave, não por literal solto.
- [ ] Definir contrato de erro com `code` estável e mapeamento no cliente.
- [ ] Usar `Intl` para datas, números e moeda de exibição.

## Fase 2 — Segundo locale

- [ ] Adicionar o segundo arquivo de mensagens (ex.: `en` ou `en-US`).
- [ ] Configurar routing ou middleware de locale, se aplicável.
- [ ] Validar paridade de chaves entre locales.

## Fase 3 — Escala

- [ ] Traduzir templates de e-mail/PDF gerados no servidor, quando existirem.
- [ ] Avaliar CI e processo/ferramenta de tradução quando o volume justificar.
