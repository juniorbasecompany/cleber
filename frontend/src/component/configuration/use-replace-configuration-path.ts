import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect } from "react";

import type { ConfigurationSelectionKey } from "@/lib/navigation/configuration-path";
import { buildConfigurationQueryPath } from "@/lib/navigation/configuration-path";

/**
 * Mantém a URL alinhada à seleção atual (`scope`, `location`, …) sem scroll extra.
 */
export function useReplaceConfigurationPath(
    basePath: string,
    searchParams: ReadonlyURLSearchParams,
    replacePath: (path: string) => void,
    paramName: string,
    selectionKey: ConfigurationSelectionKey
): void {
    useEffect(() => {
        const currentQuery = searchParams.toString();
        const currentPath = currentQuery ? `${basePath}?${currentQuery}` : basePath;
        const nextPath = buildConfigurationQueryPath(basePath, paramName, selectionKey);
        if (currentPath !== nextPath) {
            replacePath(nextPath);
        }
    }, [basePath, paramName, replacePath, searchParams, selectionKey]);
}
