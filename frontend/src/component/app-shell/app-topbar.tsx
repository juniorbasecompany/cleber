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
    <header className="ui-topbar relative z-30 flex items-center justify-between gap-4 px-6 py-4 backdrop-blur lg:px-8">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="ui-topbar-chip inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_4px_rgba(37,117,216,0.12)]" />
            {tenantLabel}
          </span>
        </div>
        <p className="ui-header-title mt-3 truncate text-lg font-semibold tracking-[-0.02em] text-[var(--color-text)]">
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
