"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavigationIcon, ValoraMark } from "@/component/ui/ui-icons";

type NavigationItem = {
  key: string;
  label: string;
  href?: string;
  statusLabel?: string;
};

type NavigationIconKind =
  | "home"
  | "operation"
  | "record"
  | "import"
  | "process"
  | "audit";

type AppSidebarProps = {
  productName: string;
  productStage: string;
  workspaceLabel: string;
  navigationItemList: NavigationItem[];
};

export function AppSidebar({
  productName,
  productStage,
  workspaceLabel,
  navigationItemList
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="ui-sidebar flex h-full w-full max-w-[19.5rem] shrink-0 flex-col">
      <div className="relative border-b border-[var(--color-border)] px-5 py-6">
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 rounded-[1.25rem] border border-[rgba(37,117,216,0.12)] bg-white/80 p-1.5 shadow-[var(--shadow-xs)]">
            <ValoraMark />
          </div>
          <div className="min-w-0">
            <span className="ui-pill ui-pill-construction inline-flex w-fit px-3 py-1 text-[11px] font-semibold tracking-[0.08em]">
              {productStage}
            </span>
            <h1 className="ui-header-title mt-4 text-[1.7rem] font-semibold tracking-[-0.03em] text-[var(--color-text)]">
              {productName}
            </h1>
            <p className="mt-2 max-w-[14rem] text-sm leading-6 text-[var(--color-text-subtle)]">
              {workspaceLabel}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-5">
        {navigationItemList.map((navigationItem) => {
          const isPlanned = !navigationItem.href;
          const navigationIconKind = navigationItem.key as NavigationIconKind;
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`ui-icon-badge h-10 w-10 rounded-[1rem] ${
                    isPlanned
                      ? "ui-icon-badge-construction"
                      : ""
                  }`}
                >
                  <NavigationIcon
                    kind={navigationIconKind}
                    className="h-[1.05rem] w-[1.05rem]"
                  />
                </span>
                <span className="min-w-0 truncate text-sm font-medium">
                  {navigationItem.label}
                </span>
              </span>
              {navigationItem.statusLabel ? (
                <span
                  className={`ui-pill px-2.5 py-1 text-[11px] font-semibold ${
                    isPlanned
                      ? "ui-pill-construction"
                      : ""
                  }`}
                >
                  {navigationItem.statusLabel}
                </span>
              ) : null}
            </>
          );

          if (navigationItem.href) {
            const isActive =
              pathname === navigationItem.href ||
              (navigationItem.href !== "/" &&
                pathname.startsWith(`${navigationItem.href}/`));

            return (
              <Link
                key={navigationItem.key}
                href={navigationItem.href}
                className={`ui-nav-item flex items-center justify-between gap-3 px-3 py-3 text-sm ${
                  isActive
                    ? "ui-nav-item-active"
                    : ""
                }`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={navigationItem.key}
              className="ui-nav-item ui-nav-item-coming-soon ui-nav-item-muted flex items-center justify-between gap-3 px-3 py-3 text-sm"
            >
              {content}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
