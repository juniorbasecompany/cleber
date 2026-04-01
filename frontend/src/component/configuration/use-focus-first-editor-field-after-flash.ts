import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type FocusableEditorField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isTextLikeInput(element: HTMLInputElement) {
  const textLikeTypeList = new Set([
    "text",
    "search",
    "url",
    "tel",
    "password"
  ]);
  return textLikeTypeList.has(element.type);
}

/**
 * No início do flash de troca de contexto no editor, posiciona foco/caret no primeiro campo editável.
 */
export function useFocusFirstEditorFieldAfterFlash(
  editorPanelRef: RefObject<HTMLElement | null>,
  isEditorFlashActive: boolean,
  enabled: boolean
) {
  const wasFlashActiveRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      wasFlashActiveRef.current = false;
      return;
    }

    const isStartingFlash = !wasFlashActiveRef.current && isEditorFlashActive;
    wasFlashActiveRef.current = isEditorFlashActive;

    if (!isStartingFlash) {
      return;
    }

    window.requestAnimationFrame(() => {
      const panel = editorPanelRef.current;
      if (!panel) {
        return;
      }

      const firstField = panel.querySelector<FocusableEditorField>(
        "input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])"
      );
      if (!firstField) {
        return;
      }

      firstField.focus();

      if (firstField instanceof HTMLInputElement && isTextLikeInput(firstField)) {
        const caretPosition = firstField.value.length;
        try {
          firstField.setSelectionRange(caretPosition, caretPosition);
        } catch {
          // Alguns tipos de input podem não suportar seleção programática.
        }
      }

      if (firstField instanceof HTMLTextAreaElement) {
        const caretPosition = firstField.value.length;
        firstField.setSelectionRange(caretPosition, caretPosition);
      }
    });
  }, [editorPanelRef, enabled, isEditorFlashActive]);
}
