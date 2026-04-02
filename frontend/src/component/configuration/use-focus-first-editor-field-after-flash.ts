import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type FocusableEditorField =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLElement;

const PRIMARY_FIELD_SELECTOR = "[data-editor-primary-field='true']";
const DEFAULT_FOCUS_CANDIDATE_SELECTOR = [
  "input:not([type='hidden'])",
  "textarea",
  "select",
  "[role='combobox'][tabindex]:not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

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

function isElementVisible(element: HTMLElement): boolean {
  if (element.getClientRects().length === 0) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function hasDisabledSemantic(element: HTMLElement): boolean {
  if (element.matches("[disabled], [aria-disabled='true'], [hidden], [inert]")) {
    return true;
  }
  const disabledContainer = element.closest("[aria-disabled='true'], [hidden], [inert]");
  if (disabledContainer) {
    return true;
  }
  if (element instanceof HTMLSelectElement) {
    return element.disabled;
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.disabled || element.readOnly;
  }
  return false;
}

function isEligibleFocusableField(element: HTMLElement): boolean {
  if (!isElementVisible(element) || hasDisabledSemantic(element)) {
    return false;
  }
  if (element.tabIndex < 0 && !(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
    return false;
  }
  return true;
}

function findFirstFocusableField(panel: HTMLElement): FocusableEditorField | null {
  const primaryCandidateList = panel.querySelectorAll<HTMLElement>(PRIMARY_FIELD_SELECTOR);
  for (const candidate of primaryCandidateList) {
    if (isEligibleFocusableField(candidate)) {
      return candidate;
    }
  }

  const fallbackCandidateList = panel.querySelectorAll<HTMLElement>(DEFAULT_FOCUS_CANDIDATE_SELECTOR);
  for (const candidate of fallbackCandidateList) {
    if (isEligibleFocusableField(candidate)) {
      return candidate;
    }
  }
  return null;
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

      const firstField = findFirstFocusableField(panel);
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
