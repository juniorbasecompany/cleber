/** Segmento `app/` (home enquanto carrega): painel superior + grelha de cards. */
export function AppSegmentSkeleton({ busyAriaLabel }: { busyAriaLabel: string }) {
  return (
    <section
      className="ui-page-stack"
      aria-busy="true"
      aria-label={busyAriaLabel}
    >
      <div className="ui-panel ui-loading-panel">
        <div className="ui-skeleton ui-skeleton-pill ui-skeleton-title ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-space-top-xl ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-medium ui-space-top-sm ui-pulse" />
      </div>

      <div className="ui-grid-cards-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="ui-card ui-loading-card">
            <div className="ui-skeleton ui-skeleton-tile ui-skeleton-icon ui-pulse" />
            <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-space-top-lg ui-pulse" />
            <div className="ui-skeleton ui-skeleton-line ui-space-top-lg ui-pulse" />
            <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-short ui-space-top-sm ui-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

export type ConfigurationWorkspaceGrowRatio = "2-4" | "4-3";

/** Casca típica de configuração: cabeçalho + lista à esquerda + editor à direita. */
export function ConfigurationWorkspaceSkeleton({
  busyAriaLabel,
  growRatio = "2-4"
}: {
  busyAriaLabel: string;
  growRatio?: ConfigurationWorkspaceGrowRatio;
}) {
  return (
    <section
      className="ui-page-stack"
      aria-busy="true"
      aria-label={busyAriaLabel}
    >
      <div className="ui-panel ui-loading-panel">
        <div className="ui-skeleton ui-skeleton-pill ui-skeleton-title ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-space-top-xl ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-medium ui-space-top-sm ui-pulse" />
      </div>

      <div
        className={`ui-layout-directory ui-layout-directory-editor ui-layout-directory-editor--grow-${growRatio}`}
      >
        <aside className="ui-panel ui-stack-lg ui-panel-context-card">
          <div
            className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse"
            style={{ height: "2.5rem" }}
          />
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse"
              style={{ marginTop: "0.5rem", height: "2.75rem", borderRadius: "0.5rem" }}
            />
          ))}
        </aside>

        <div className="ui-panel ui-panel-editor ui-editor-panel">
          <div className="ui-editor-panel-body ui-editor-card-flow">
            <div className="ui-card ui-form-section">
              <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-pulse" />
              <div
                className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse ui-space-top-lg"
                style={{ height: "2.5rem" }}
              />
              <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-pulse ui-space-top-lg" />
              <div
                className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse ui-space-top-sm"
                style={{ height: "2.5rem" }}
              />
              <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-pulse ui-space-top-lg" />
              <div
                className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse ui-space-top-sm"
                style={{ minHeight: "5rem" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Painel de cálculo: cabeçalho, filtros e área de tabela. */
export function CalculationWorkspaceSkeleton({ busyAriaLabel }: { busyAriaLabel: string }) {
  return (
    <section
      className="ui-page-stack ui-page-stack-footer"
      aria-busy="true"
      aria-label={busyAriaLabel}
    >
      <div className="ui-panel ui-loading-panel">
        <div className="ui-skeleton ui-skeleton-pill ui-skeleton-title ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-space-top-xl ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-medium ui-space-top-sm ui-pulse" />
      </div>

      <div className="ui-current-age-filter-panel">
        <div className="ui-stack-lg" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="ui-card ui-form-section" style={{ padding: "1.25rem" }}>
            <div className="ui-grid-cards-2">
              <div>
                <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-pulse" />
                <div
                  className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse ui-space-top-sm"
                  style={{ height: "2.5rem" }}
                />
              </div>
              <div>
                <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-pulse" />
                <div
                  className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse ui-space-top-sm"
                  style={{ height: "2.5rem" }}
                />
              </div>
            </div>
          </div>
          <div className="ui-card ui-form-section" style={{ padding: "1.25rem" }}>
            <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-pulse" />
            <div
              className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse ui-space-top-sm"
              style={{ height: "2.5rem" }}
            />
          </div>
        </div>
      </div>

      <div className="ui-current-age-table-shell ui-panel">
        <div className="ui-current-age-table-scroll" style={{ padding: "0.75rem" }}>
          <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse" style={{ height: "2rem" }} />
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="ui-pulse"
              style={{ display: "flex", gap: "0.75rem", marginTop: "0.65rem" }}
            >
              <div className="ui-skeleton ui-skeleton-line ui-pulse" style={{ flex: "0 0 5rem", height: "1rem" }} />
              <div className="ui-skeleton ui-skeleton-line ui-pulse" style={{ flex: "1 1 auto", height: "1rem" }} />
              <div className="ui-skeleton ui-skeleton-line ui-pulse" style={{ flex: "0 0 4rem", height: "1rem" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Linhas tipo item de menu durante fetch da lista. */
export function MenuListSkeleton({ rowCount = 4 }: { rowCount?: number }) {
  return (
    <div className="ui-menu-skeleton-list" role="presentation">
      {Array.from({ length: rowCount }).map((_, index) => (
        <div
          key={index}
          className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse"
          style={{
            height: "2.25rem",
            borderRadius: "0.5rem",
            marginBottom: "0.35rem"
          }}
        />
      ))}
    </div>
  );
}

/** Entradas do histórico de auditoria durante carregamento inicial. */
export function HistoryListSkeleton({ entryCount = 4 }: { entryCount?: number }) {
  return (
    <ul className="ui-history-log-list" aria-hidden>
      {Array.from({ length: entryCount }).map((_, index) => (
        <li key={index} className="ui-history-log-entry">
          <div className="ui-history-log-entry-row">
            <div className="ui-history-log-cell ui-history-log-cell-start">
              <div className="ui-skeleton ui-skeleton-line ui-pulse" style={{ width: "100%", height: "1.75rem" }} />
            </div>
            <div className="ui-history-log-cell ui-history-log-cell-center">
              <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse" style={{ height: "1rem" }} />
            </div>
            <div className="ui-history-log-cell ui-history-log-cell-end">
              <div className="ui-skeleton ui-skeleton-line ui-pulse" style={{ width: "100%", height: "1.75rem" }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Linhas da lista de fórmulas durante fetch. */
export function FormulaRowsSkeleton({ rowCount = 3 }: { rowCount?: number }) {
  return (
    <div className="ui-formula-list" role="presentation">
      {Array.from({ length: rowCount }).map((_, index) => (
        <div
          key={index}
          className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse"
          style={{ height: "3rem", borderRadius: "0.5rem", marginBottom: "0.5rem" }}
        />
      ))}
    </div>
  );
}

/** Campos de formulário genéricos (ex.: inputs dinâmicos do evento). */
export function FormFieldsSkeleton({ fieldCount = 3 }: { fieldCount?: number }) {
  return (
    <div className="ui-stack-lg" role="presentation">
      {Array.from({ length: fieldCount }).map((_, index) => (
        <div key={index} className="ui-field">
          <div className="ui-skeleton ui-skeleton-line ui-skeleton-label-wide ui-pulse" />
          <div
            className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse ui-space-top-sm"
            style={{ height: "2.5rem" }}
          />
        </div>
      ))}
    </div>
  );
}

/** Conteúdo da tabela de resultados durante leitura/cálculo/eliminação. */
export function CurrentAgeResultTableSkeleton({
  busyAriaLabel,
  columnCount = 4,
  rowCount = 5
}: {
  busyAriaLabel: string;
  columnCount?: number;
  rowCount?: number;
}) {
  return (
    <div
      className="ui-current-age-table-shell ui-panel ui-current-age-result-skeleton"
      aria-busy="true"
      aria-label={busyAriaLabel}
    >
      <div className="ui-current-age-table-scroll" style={{ padding: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div className="ui-skeleton ui-skeleton-line ui-pulse" style={{ flex: "0 0 5rem", height: "1rem" }} />
          {Array.from({ length: columnCount }).map((_, index) => (
            <div
              key={index}
              className="ui-skeleton ui-skeleton-line ui-pulse"
              style={{ flex: "1 1 6rem", height: "1rem" }}
            />
          ))}
        </div>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
          >
            <div className="ui-skeleton ui-skeleton-line ui-pulse" style={{ flex: "0 0 5rem", height: "1rem" }} />
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="ui-skeleton ui-skeleton-line ui-pulse"
                style={{ flex: "1 1 6rem", height: "1rem" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cartões da seleção de tenant (auth) enquanto a lista ainda não chegou. */
export function TenantSelectionSkeleton({ busyAriaLabel }: { busyAriaLabel: string }) {
  return (
    <div
      className="ui-page-stack"
      aria-busy="true"
      aria-label={busyAriaLabel}
    >
      <div className="ui-panel ui-loading-panel">
        <div className="ui-skeleton ui-skeleton-pill ui-skeleton-title ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-space-top-xl ui-pulse" />
        <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-medium ui-space-top-sm ui-pulse" />
      </div>
      <div className="ui-panel ui-auth-selection-card">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="ui-preview-card ui-stack-lg"
            style={{ marginBottom: "1rem", padding: "1.25rem" }}
          >
            <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-wide ui-pulse" style={{ height: "1.25rem" }} />
            <div className="ui-skeleton ui-skeleton-line ui-skeleton-line-medium ui-pulse ui-space-top-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
