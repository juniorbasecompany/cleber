import { useCallback, useRef } from "react";

/**
 * Invalida resultados de GET do diretório que começaram antes de um sync programático
 * (`applySyncFromHandlers` após save, seleção, etc.), evitando corrida save vs refetch.
 */
export function useConfigurationDirectoryFetchGeneration() {
  const generationRef = useRef(0);

  const bumpAfterProgrammaticSync = useCallback(() => {
    generationRef.current += 1;
  }, []);

  const captureGenerationAtFetchStart = useCallback(() => generationRef.current, []);

  const isFetchResultStale = useCallback(
    (generationAtFetchStart: number) =>
      generationAtFetchStart !== generationRef.current,
    []
  );

  return {
    bumpAfterProgrammaticSync,
    captureGenerationAtFetchStart,
    isFetchResultStale
  };
}
