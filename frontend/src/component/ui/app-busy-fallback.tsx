/** Fallback de carregamento sem skeleton (sem texto visível; `aria-label` na secção). */

export function AppBusyFallback({
  busyAriaLabel,
  pageStackClassName
}: {
  busyAriaLabel: string;
  /** Ex.: `ui-page-stack-footer` para alinhar com o layout da página de cálculo. */
  pageStackClassName?: string;
}) {
  void pageStackClassName;

  return (
    <span
      className="ui-sr-only"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      {busyAriaLabel}
    </span>
  );
}

export function AppBusyInline({ label }: { label: string }) {
  return (
    <p className="ui-app-busy-inline" role="status" aria-busy="true" aria-live="polite">
      {label}
    </p>
  );
}
