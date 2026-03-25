/**
 * Política partilhada entre painéis de configuração com diretório + editor (escopo, locais, …).
 * Validação de permissões destrutivas fica no backend; a UI não usa `can_delete` para desativar o botão.
 */

export type DirectoryEditorCanSubmitInput = {
    isCreateMode: boolean;
    isDeletePending: boolean;
    /** Ex.: `directory.can_create` ou `directory?.can_create ?? false`. */
    canCreate: boolean;
    /** Ex.: `selectedRecord?.can_edit ?? false` no modo edição. */
    canEdit: boolean;
};

/**
 * Regra canónica alinhada a scope e location: em exclusão pendente, `canSubmit` é true (a API recusa se inválido).
 */
export function directoryEditorCanSubmitForDirectoryEditor(
    input: DirectoryEditorCanSubmitInput
): boolean {
    const { isCreateMode, isDeletePending, canCreate, canEdit } = input;
    if (isCreateMode) {
        return canCreate;
    }
    if (isDeletePending) {
        return true;
    }
    return canEdit;
}

export type DirectoryEditorSaveDisabledInput = {
    /**
     * Há contexto mínimo para operar: ex. escopo com `selectedScopeKey` truthy; local com `directory` definido.
     */
    hasEditableContext: boolean;
    canSubmit: boolean;
    isSaving: boolean;
    isDirty: boolean;
};

/** Expressão única para `ConfigurationEditorFooter.saveDisabled` nestes painéis. */
export function directoryEditorSaveDisabled(
    input: DirectoryEditorSaveDisabledInput
): boolean {
    const { hasEditableContext, canSubmit, isSaving, isDirty } = input;
    return !hasEditableContext || !canSubmit || isSaving || !isDirty;
}
