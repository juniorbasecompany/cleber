export type ConfigurationSelectionKey = number | "new" | null;

/**
 * Monta path com query única (`scope=`, `location=`, etc.) para telas de configuração.
 */
export function buildConfigurationQueryPath(
    basePath: string,
    paramName: string,
    key: ConfigurationSelectionKey
): string {
    const params = new URLSearchParams();
    if (key === "new") {
        params.set(paramName, "new");
    } else if (typeof key === "number") {
        params.set(paramName, String(key));
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
}
