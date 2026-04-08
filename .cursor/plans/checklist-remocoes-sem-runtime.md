# Checklist: candidatos a remoção sem impacto no runtime

Checklist copiada do plano de revisão; itens abaixo com `[x]` foram **aplicados** neste repositório (secções 1–5). A secção 6 ficou por decisão futura.

**Como usar:** marque com `[x]` o que quiser excluir em rodadas seguintes.

---

## 1. Código de UI aparentemente morto (produto)

- [x] **`frontend/src/component/configuration/configuration-history-placeholder.tsx`** — removido; doc em `architecture/configuration-panels.md` ajustada.

---

## 2. Pasta `archive/` (histórico; zero ligação ao build)

- [x] **Remover toda a pasta `archive/`** — aplicado; README e `architecture/source-of-truth.md` atualizados.

Itens granulares (só relevantes se a pasta voltar a existir):

- [ ] `archive/ui-mockups/` (HTML + CSS)
- [ ] `archive/competing/competitive-landscape.md`
- [ ] `archive/review/plano-ajustado.md`
- [ ] `archive/superseded/plano-avicola-v2.docx`

---

## 3. Pasta `reference/` (consulta; não entra no build)

- [x] **Remover toda a pasta `reference/`** — aplicado; README e `architecture/source-of-truth.md` atualizados.

Ou por subpasta (se a pasta voltar a existir):

- [ ] `reference/inspiration/*.xlsx`
- [ ] `reference/migration/planilhas-e-sistema.md`
- [ ] `reference/niche/*.md`
- [ ] `reference/domain/consideracoes-de-dominio.md`

---

## 4. Scripts Python pontuais em `backend/` (desenvolvimento / diagnóstico)

- [x] `backend/script_test_deepl_connection.py`
- [x] `backend/script_test_deepl_source_lang.py`
- [x] `backend/script_test_event_input_value.py`
- [x] `backend/script_test_filter_directory.py`
- [x] `backend/script_patch_field_label_via_api.py`
- [x] `backend/script_debug_current_age_calculation.py`
- [x] `backend/script_run_current_age_from_local_db.py`
- [x] `backend/script_check_current_age_result_order.py`
- [x] `backend/script_verify_audit_schema.py`
- [x] `backend/script_try_formula_validate.py`
- [x] `backend/script_validate_schema_phase1.py`

`backend/README.md` alinhado (sem referências a estes scripts).

---

## 5. Redundância menor no frontend (opcional)

- [x] Removido o script npm **`check:semantic-ui`** duplicado de `lint` em `frontend/package.json`.

**Não apagar:** `frontend/script_audit_i18n_keys.py` — usado por `npm run check:i18n`.

---

## 6. Planos em `.cursor/plans/` (processo do agente, não runtime)

- [ ] **Limpar ou arquivar fora do Git** ficheiros em `.cursor/plans/` que já não forem úteis (volátil por política do projeto).

---

## Resumo do que a revisão original não encontrou

- Sem `frontend/public` com imagens órfãs relevantes; ícones/flags em TSX.
- Sem workflows em `.github/workflows` óbvios como CI morto.
- Poucos `FIXME` / `@deprecated` no código de aplicação; `legacy` em campos e DDL de downgrade de migração não são alvo desta limpeza.
