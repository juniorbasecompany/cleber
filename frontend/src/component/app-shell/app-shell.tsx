import type { ReactNode } from "react";

import { AppSidebar } from "@/component/app-shell/app-sidebar";
import { AppTopbar } from "@/component/app-shell/app-topbar";

type NavigationItem = {
  key: string;
  label: string;
  href?: string;
  statusLabel?: string;
};

type AppShellProps = {
  children: ReactNode;
  productName: string;
  productStage: string;
  workspaceLabel: string;
  navigationItemList: NavigationItem[];
  tenantLabel: string;
  tenantValue: string;
  accountSlot?: ReactNode;
  topbarActionSlot?: ReactNode;
};

export function AppShell({
  children,
  productName,
  productStage,
  workspaceLabel,
  navigationItemList,
  tenantLabel,
  tenantValue,
  accountSlot,
  topbarActionSlot
}: AppShellProps) {
  return (
    <div className="ui-shell flex h-screen overflow-hidden">
      <AppSidebar
        productName={productName}
        productStage={productStage}
        workspaceLabel={workspaceLabel}
        navigationItemList={navigationItemList}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopbar
          tenantLabel={tenantLabel}
          tenantValue={tenantValue}
          accountSlot={accountSlot}
          actionSlot={topbarActionSlot}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-7 px-6 py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
