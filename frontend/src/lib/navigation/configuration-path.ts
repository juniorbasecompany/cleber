import type { ReadonlyURLSearchParams } from "next/navigation";

export type ConfigurationSelectionKey = number | "new" | null;

/**
 * Após salvar uma edição (PATCH), escolhe a chave de seleção no diretório:
 * formulário vazio (`"new"`) quando ainda é permitido criar outro registo;
 * caso contrário mantém o id que estava em edição.
 */
export function preferredSelectionKeyAfterEditSave(
    canEdit: boolean,
    selectedId: number
): ConfigurationSelectionKey {
    return canEdit ? "new" : selectedId;
}

/**
 * Indica se o valor atual de `paramName` na query já corresponde à chave de seleção.
 * Evita `router.replace` quando só a ordem ou serialização da query difere (mesmo conjunto de parâmetros).
 */
export function urlParamMatchesSelectionKey(
    searchParams: ReadonlyURLSearchParams | URLSearchParams,
    paramName: string,
    key: ConfigurationSelectionKey
): boolean {
    const raw = searchParams.get(paramName);
    if (key === "new") {
        return raw === "new";
    }
    if (typeof key === "number") {
        return raw === String(key);
    }
    return raw === null;
}

/**
 * Atualiza só a query na barra de endereços de forma síncrona (`history.replaceState`),
 * antes de `setState`, para que um remount imediato não leia `member=` / `action=` desatualizado.
 * O router do Next continua a ser alinhado por `useReplaceConfigurationPath` no layout effect.
 */
export function applyConfigurationSelectionToWindowHistory(
    basePath: string,
    paramName: string,
    key: ConfigurationSelectionKey
): void {
    if (typeof window === "undefined") {
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const nextPath = buildConfigurationQueryPath(basePath, paramName, key, params);
    window.history.replaceState(window.history.state, "", nextPath);
}

/**
 * Monta path com query para telas de configuração.
 * Se `preserveSearchParams` for passado, copia os pares existentes e só altera `paramName`
 * (evita perder `scope=` e outros ao alinhar `member`, `action`, etc.).
 */
export function buildConfigurationQueryPath(
    basePath: string,
    paramName: string,
    key: ConfigurationSelectionKey,
    preserveSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
    const params = preserveSearchParams
        ? new URLSearchParams(preserveSearchParams.toString())
        : new URLSearchParams();
    if (key === "new") {
        params.set(paramName, "new");
    } else if (typeof key === "number") {
        params.set(paramName, String(key));
    } else {
        params.delete(paramName);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
}
