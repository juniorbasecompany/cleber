import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LocationConfigurationClient } from "@/component/configuration/location-configuration-client";
import { AppBusyFallback } from "@/component/ui/app-busy-fallback";
import {
  getAuthSession,
  getTenantLocationDirectory,
  getTenantScopeDirectory
} from "@/lib/auth/server-session";

type LocationConfigurationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocationConfigurationPage({
  params
}: LocationConfigurationPageProps) {
  const { locale } = await params;
  const tState = await getTranslations("State");

  return (
    <Suspense
      fallback={<AppBusyFallback busyAriaLabel={tState("loadingAriaLabel")} />}
    >
      <LocationConfigurationData locale={locale} />
    </Suspense>
  );
}

async function LocationConfigurationData({ locale }: { locale: string }) {
  const [authSession, scopeDirectory] = await Promise.all([
    getAuthSession(),
    getTenantScopeDirectory()
  ]);

  if (!authSession || !scopeDirectory) {
    redirect(`/${locale}/login?reason=auth_required`);
  }

  const currentScope =
    scopeDirectory.item_list.find(
      (item) => item.id === authSession.member.current_scope_id
    ) ??
    null;
  const locationDirectory =
    currentScope != null ? await getTenantLocationDirectory(currentScope.id) : null;

  const t = await getTranslations("LocationConfigurationPage");

  return (
    <LocationConfigurationClient
      locale={locale}
      currentScope={currentScope}
      hasAnyScope={scopeDirectory.item_list.length > 0}
      initialLocationDirectory={locationDirectory}
      copy={{
        title: t("title"),
        description: t("description"),
        emptyScope: t("list.emptyScope"),
        missingCurrentScope: t("list.missingCurrentScope"),
        historyTitle: t("history.title"),
        historyDescription: t("history.description"),
        filterSearchLabel: t("filter.searchLabel"),
        filterToggleAriaLabel: t("filter.toggleAriaLabel"),
        filterToggleLabel: t("filter.toggleLabel"),
        nameLabel: t("section.identity.nameLabel"),
        nameHint: t("section.identity.nameHint"),
        dragHandleAria: t("dragHandleAria"),
        cancel: t("action.cancel"),
        directoryCreateLabel: t("action.new"),
        newChild: t("action.newChild"),
        newSibling: t("action.newSibling"),
        delete: t("action.delete"),
        undoDelete: t("action.undoDelete"),
        save: t("action.save"),
        saving: t("action.saving"),
        moveUp: t("action.moveUp"),
        moveDown: t("action.moveDown"),
        readOnlyNotice: t("readOnlyNotice"),
        loadError: t("error.load"),
        moveError: t("error.move"),
        validationError: t("error.validation"),
        discardConfirm: t("discardConfirm")
      }}
    />
  );
}
