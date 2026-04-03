"use client";

import type { ReactNode } from "react";

import type { DirectoryFilterStorageSegment } from "@/component/configuration/directory-filter-visibility";
import {
  toggleDirectoryFilterPanelVisible,
  useDirectoryFilterPanelVisible
} from "@/component/configuration/directory-filter-visibility";

type ConfigurationDirectoryListToolbarRowProps = {
  /** Conteúdo à direita (ex.: botão Novo). */
  end?: ReactNode;
  /** Quando falso, não mostra o switch (ex.: sem painel de filtros na tela). */
  showFilterToggle: boolean;
  /** Segmento igual ao do painel de filtros; obrigatório se `showFilterToggle`. */
  filterSegment?: DirectoryFilterStorageSegment;
  filterToggleAriaLabel: string;
  /** Texto visível à direita do switch (ex.: «Filtro»). */
  filterToggleLabel: string;
};

export function ConfigurationDirectoryListToolbarRow({
  end,
  showFilterToggle,
  filterSegment,
  filterToggleAriaLabel,
  filterToggleLabel
}: ConfigurationDirectoryListToolbarRowProps) {
  const visible = useDirectoryFilterPanelVisible(
    showFilterToggle ? filterSegment : undefined
  );

  if (!showFilterToggle && !end) {
    return null;
  }

  return (
    <div className="ui-configuration-directory-list-toolbar">
      <div className="ui-configuration-directory-list-toolbar-leading">
        {showFilterToggle && filterSegment != null ? (
          <>
            <button
              type="button"
              role="switch"
              aria-checked={visible}
              aria-label={filterToggleAriaLabel}
              className="ui-directory-filter-visibility-switch"
              onClick={() => {
                if (filterSegment != null) {
                  toggleDirectoryFilterPanelVisible(filterSegment);
                }
              }}
            >
              <span
                className="ui-directory-filter-visibility-switch-track"
                data-on={visible ? "true" : undefined}
              >
                <span className="ui-directory-filter-visibility-switch-thumb" aria-hidden />
              </span>
            </button>
            <span className="ui-configuration-directory-list-toolbar-filter-label">
              {filterToggleLabel}
            </span>
          </>
        ) : null}
      </div>
      <div className="ui-configuration-directory-list-toolbar-end">{end}</div>
    </div>
  );
}
