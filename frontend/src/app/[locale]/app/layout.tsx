import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AppShell } from "@/component/app-shell/app-shell";
import { AccountMenu } from "@/component/app-shell/account-menu";
import { WorkspaceContextMenu } from "@/component/app-shell/workspace-context-menu";
import { getAuthSession, getTenantScopeDirectory } from "@/lib/auth/server-session";
import { routing } from "@/i18n/routing";

type AppLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

function getScopeDisplayName(scope: { id: number; name: string }) {
  return scope.name.trim() || `#${scope.id}`;
}

export default async function AppLayout({
  children,
  params
}: AppLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations("AppShell");
  const authSession = await getAuthSession();

  if (!authSession) {
    redirect(`/${locale}/login?reason=auth_required`);
  }

  const scopeDirectory = await getTenantScopeDirectory();
  const currentScopeId =
    scopeDirectory?.current_scope_id ?? authSession.member.current_scope_id ?? null;
  const currentScope =
    scopeDirectory?.item_list.find(
      (scope) =>
        scope.id === currentScopeId
    ) ??
    scopeDirectory?.item_list[0] ??
    null;
  const contentContextKey = `tenant:${authSession.tenant.id}:scope:${currentScopeId ?? "none"}`;
  const mobileWorkspaceLabel = currentScope
    ? `${authSession.tenant.name} - ${getScopeDisplayName(currentScope)}`
    : authSession.tenant.name;

  const navigationItemList = [
    {
      key: "home",
      label: t("navigation.home"),
      href: `/${locale}/app`
    },
    {
      key: "field",
      label: t("navigation.field"),
      href: `/${locale}/app/configuration/field`
    },
    {
      key: "action",
      label: t("navigation.action"),
      href: `/${locale}/app/configuration/action`
    },
    {
      key: "location",
      label: t("navigation.location"),
      href: `/${locale}/app/configuration/location`
    },
    {
      key: "item",
      label: t("navigation.item"),
      href: `/${locale}/app/configuration/item`
    },
    {
      key: "unity",
      label: t("navigation.unity"),
      href: `/${locale}/app/configuration/unity`
    },
    {
      key: "eventStandard",
      label: t("navigation.eventStandard"),
      href: `/${locale}/app/configuration/event/standard`
    },
    {
      key: "eventFact",
      label: t("navigation.eventFact"),
      href: `/${locale}/app/configuration/event/fact`
    },
    {
      key: "calculation",
      label: t("navigation.calculation"),
      href: `/${locale}/app/calculation`
    }
  ];

  return (
    <AppShell
      productName={t("productName")}
      workspaceLabel={authSession.tenant.name}
      mobileWorkspaceLabel={mobileWorkspaceLabel}
      workspaceSlot={
        <WorkspaceContextMenu
          currentTenantId={authSession.tenant.id}
          currentTenantName={authSession.tenant.name}
          initialScopeList={scopeDirectory?.item_list ?? []}
          initialCurrentScopeId={
            scopeDirectory?.current_scope_id ??
            authSession.member.current_scope_id ??
            null
          }
          copy={{
            tenantTriggerAriaLabel: t("menu.tenantTriggerAriaLabel"),
            tenantMenuAriaLabel: t("menu.tenantMenuAriaLabel"),
            scopeTriggerAriaLabel: t("menu.scopeTriggerAriaLabel"),
            scopeMenuAriaLabel: t("menu.scopeMenuAriaLabel"),
            tenantListError: t("menu.tenantListError"),
            emptyTenantList: t("menu.emptyTenantList"),
            switchingTenant: t("menu.switchingTenant"),
            scopeListError: t("menu.scopeListError"),
            emptyScopeList: t("menu.emptyScopeList"),
            switchingScope: t("menu.switchingScope"),
            noScopeLabel: t("menu.noScopeLabel")
          }}
        />
      }
      navigationItemList={navigationItemList}
      mobileNavigationOpenLabel={t("topbar.openNavigation")}
      mobileNavigationCloseLabel={t("topbar.closeNavigation")}
      accountSlot={
        <AccountMenu
          placement="sidebar"
          currentLocale={locale}
          localeList={[...routing.locales]}
          accountName={
            authSession.member.name ||
            authSession.account.name ||
            authSession.account.email
          }
          tenantHref={`/${locale}/app/configuration/tenant`}
          memberHref={`/${locale}/app/configuration/member`}
          scopeHref={`/${locale}/app/configuration/scope`}
          copy={{
            localeFlagTriggerAriaLabel: t("menu.localeFlagTriggerAriaLabel"),
            localeFlagMenuAriaLabel: t("menu.localeFlagMenuAriaLabel"),
            tenantShortcutLabel: t("menu.tenantShortcutLabel"),
            memberShortcutLabel: t("menu.memberShortcutLabel"),
            scopeShortcutLabel: t("menu.scopeShortcutLabel"),
            switchingLocale: t("menu.switchingLocale"),
            signOutLabel: t("topbar.signOut"),
            signOutPendingLabel: t("topbar.signOutPending")
          }}
        />
      }
    >
      <div key={contentContextKey} className="ui-contents">
        {children}
      </div>
    </AppShell>
  );
}
