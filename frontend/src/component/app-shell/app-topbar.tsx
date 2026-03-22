import type { ReactNode } from "react";

type AppTopbarProps = {
  tenantLabel: string;
  tenantValue: string;
  accountSlot?: ReactNode;
  actionSlot?: ReactNode;
};

export function AppTopbar({
  tenantLabel,
  tenantValue,
  accountSlot,
  actionSlot
}: AppTopbarProps) {
  return (
    <header className="ui-topbar relative z-30 flex items-center justify-between gap-4 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
          {tenantLabel}
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
          {tenantValue}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {actionSlot}
        {accountSlot}
      </div>
    </header>
  );
}
