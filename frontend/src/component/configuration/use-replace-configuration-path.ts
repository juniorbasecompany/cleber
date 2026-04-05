import type { ReadonlyURLSearchParams } from "next/navigation";
import { useLayoutEffect } from "react";

import type { ConfigurationSelectionKey } from "@/lib/navigation/configuration-path";
import {
    buildConfigurationQueryPath,
    urlParamMatchesSelectionKey
} from "@/lib/navigation/configuration-path";

/**
 * Mantém a URL alinhada à seleção atual (`scope`, `location`, …) sem scroll extra.
 * Usa layout effect para alinhar a query antes de efeitos de pintura e reduzir corrida com a sincronização inicial do diretório.
 */
export function useReplaceConfigurationPath(
    basePath: string,
    searchParams: ReadonlyURLSearchParams,
    replacePath: (path: string) => void,
    paramName: string,
    selectionKey: ConfigurationSelectionKey
): void {
    useLayoutEffect(() => {
        if (urlParamMatchesSelectionKey(searchParams, paramName, selectionKey)) {
            return;
        }
        const nextPath = buildConfigurationQueryPath(
            basePath,
            paramName,
            selectionKey,
            searchParams
        );
        replacePath(nextPath);
    }, [basePath, paramName, replacePath, searchParams, selectionKey]);
}
