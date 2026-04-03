"use client";

import { useEffect, useRef, type ReactNode } from "react";

import type { DirectoryFilterStorageSegment } from "@/component/configuration/directory-filter-visibility";
import { useDirectoryFilterPanelVisible } from "@/component/configuration/directory-filter-visibility";

export type DirectoryFilterConfig = {
  panel: ReactNode;
  storageSegment: DirectoryFilterStorageSegment;
};

type ConfigurationDirectoryFilterTopSlotProps = {
  filter: DirectoryFilterConfig | undefined;
};

/** Primeiro controlo editável típico de filtro (input, select, textarea). */
function focusFirstFilterField(root: HTMLElement) {
  const selector =
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
  const el = root.querySelector<HTMLElement>(selector);
  el?.focus();
}

/**
 * Painel laranja de filtros com unfold suave; foco no primeiro campo ao abrir.
 */
export function ConfigurationDirectoryFilterTopSlot({
  filter
}: ConfigurationDirectoryFilterTopSlotProps) {
  const visible = useDirectoryFilterPanelVisible(filter?.storageSegment);
  const slotRef = useRef<HTMLDivElement>(null);
  const focusGenerationRef = useRef(0);

  useEffect(() => {
    if (!visible || !filter?.storageSegment) {
      return;
    }

    const slotEl = slotRef.current;
    if (!slotEl) {
      return;
    }

    const generation = ++focusGenerationRef.current;
    let applied = false;

    const applyFocus = () => {
      if (generation !== focusGenerationRef.current || applied) {
        return;
      }
      const node = slotRef.current;
      if (!node) {
        return;
      }
      applied = true;
      focusFirstFilterField(node);
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== slotEl) {
        return;
      }
      if (event.propertyName !== "grid-template-rows") {
        return;
      }
      applyFocus();
    };

    slotEl.addEventListener("transitionend", onTransitionEnd);
    /* Sem transição (ex.: prefers-reduced-motion) ou primeiro paint já expandido. */
    const fallbackTimer = window.setTimeout(applyFocus, 450);

    return () => {
      focusGenerationRef.current += 1;
      slotEl.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(fallbackTimer);
    };
  }, [visible, filter?.storageSegment]);

  if (!filter?.panel) {
    return null;
  }

  return (
    <div
      ref={slotRef}
      className="ui-directory-filter-top-slot"
      data-expanded={visible ? "true" : "false"}
      aria-hidden={visible ? undefined : "true"}
    >
      <div
        className="ui-directory-filter-top-slot-inner"
        inert={visible ? undefined : true}
      >
        {filter.panel}
      </div>
    </div>
  );
}
