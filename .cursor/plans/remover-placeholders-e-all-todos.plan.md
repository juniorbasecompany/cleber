---
name: Remover placeholders e All/Todos (revisão chip)
overview: Remover atributos placeholder e textos indesejados com "all"/"todos" fora do chip de filtro. Nos chips de filtro (DirectoryFilterMultiSelectField), manter rótulos como All/Todos/Todas, pois não são placeholder.
todos:
  - id: non-chip-copy
    content: Ajustar hints cálculo, kind, result.placeholder morto; sem esvaziar Member filter.all
    status: completed
  - id: chip-keep-labels
    content: Manter filter.all nos JSON para chips; corrigir fallback hardcoded ?? Todos se necessário
    status: completed
  - id: date-picker-sweep
    content: "TenantDateTimePicker: hidePlaceholder onde aplicável"
    status: completed
  - id: verify-i18n
    content: npm run check:i18n + grep
    status: completed
isProject: true
---

# Remover placeholders e ocorrências All/Todos (exceto chip)

## Regra de produto (pedido do utilizador)

- **Único sítio onde "todos" / "todas" (e equivalentes "All" por locale) devem continuar:** o **chip** de filtro em [`DirectoryFilterMultiSelectField`](frontend/src/component/configuration/directory-filter-panel.tsx), alimentado por [`MemberConfigurationPage.filter.all`](frontend/messages/en-US.json) (`allLabel={copy.filterAll}` em [`member-configuration-client.tsx`](frontend/src/component/configuration/member-configuration-client.tsx)). Aí o texto **não** actua como placeholder; é rótulo do controlo "seleccionar todos os valores do grupo".
- **Não** esvaziar `filter.all` do membro nem retirar a palavra dos três locales **para este chip**.

## O que ainda entra no âmbito de remoção / alteração

1. **Atributo HTML `placeholder`** onde o objectivo for eliminar texto fantasma no input (ex. [`kind-select-or-create-field.tsx`](frontend/src/component/configuration/kind-select-or-create-field.tsx) com `selectPlaceholder`).
2. **Chave morta** [`CalculationPage.result.placeholder`](frontend/messages/en-US.json) / prop `resultPlaceholder` se continuar sem uso no cliente ([`current-age-calculation-client.tsx`](frontend/src/component/calculation/current-age-calculation-client.tsx)).
3. **Hints** [`CalculationPage.panel.locationHint` / `itemHint`](frontend/messages/en-US.json) que dizem "consider all" / "considerar todos" / "considerar todo": reescrever **sem** usar "todos/todas/todo" nem "all" no sentido de "tudo" (ex. focar em "sem restrição" / "deixe em branco para não filtrar por…").
4. **Fallback hardcoded** `allLabel ?? "Todos"` em [`directory-filter-panel.tsx`](frontend/src/component/configuration/directory-filter-panel.tsx): se `allLabel` vier sempre do i18n para o membro, preferir **remover o fallback** ou substituir por string vazia + `aria-label` obrigatório; **não** introduzir novo texto genérico em PT fixo no código. Opcional: `allLabel ?? ""` apenas se houver `aria-label` no botão.
5. **`TenantDateTimePicker`**: onde fizer sentido, `hidePlaceholder` para não mostrar máscara como placeholder (já usado noutros ecrãs).

## O que **não** fazer (evitar regressão)

- **Não** alterar o propósito textual de `MemberConfigurationPage.filter.all` nos JSON para vazio só para "cumprir" remoção de "Todos"; o chip continua a precisar de rótulo legível.
- **Event** / **Unity** / **HierarchyDropdownField** com `allLabel=""` já existente: são outro padrão (resumo vazio do dropdown); não confundir com o chip do membro. Ajustar só se o plano de copy tocar nesses ficheiros por outro motivo.

## Verificação

- `npm run check:i18n` após mudanças em JSON/chaves.
- Grep: `placeholder=` em `src`, e `considerar todos` / `consider all` em `messages` após reescrita.
