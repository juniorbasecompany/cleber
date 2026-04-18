import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { FieldConfigurationClient } from "@/component/configuration/field-configuration-client";
import { AppBusyFallback } from "@/component/ui/app-busy-fallback";
import {
  getAuthSession,
  getTenantScopeDirectory,
  getTenantScopeFieldDirectory
} from "@/lib/auth/server-session";
import { mapAppLocaleToLabelLang } from "@/lib/i18n/label-lang";

type FieldConfigurationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FieldConfigurationPage({ params }: FieldConfigurationPageProps) {
  const { locale } = await params;
  const tState = await getTranslations("State");

  return (
    <Suspense
      fallback={
        <AppBusyFallback busyAriaLabel={tState("loadingAriaLabel")} />
      }
    >
      <FieldConfigurationData locale={locale} />
    </Suspense>
  );
}

async function FieldConfigurationData({ locale }: { locale: string }) {
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
    ) ?? null;
  const labelLang = mapAppLocaleToLabelLang(locale);
  const fieldDirectory =
    currentScope != null
      ? await getTenantScopeFieldDirectory(currentScope.id, labelLang)
      : null;

  const t = await getTranslations("FieldConfigurationPage");

  return (
    <FieldConfigurationClient
      locale={locale}
      labelLang={labelLang}
      currentScope={currentScope}
      hasAnyScope={scopeDirectory.item_list.length > 0}
      initialFieldDirectory={fieldDirectory}
      copy={{
        title: t("title"),
        description: t("description"),
        empty: t("empty"),
        emptyScope: t("list.emptyScope"),
        missingCurrentScope: t("list.missingCurrentScope"),
        loadError: t("list.loadError"),
        historyTitle: t("history.title"),
        historyDescription: t("history.description"),
        filterSearchLabel: t("filter.searchLabel"),
        filterToggleAriaLabel: t("filter.toggleAriaLabel"),
        filterToggleLabel: t("filter.toggleLabel"),
        fieldNameLabel: t("section.fieldName.label"),
        fieldNameHint: t("section.fieldName.hint"),
        fieldNameRequired: t("error.fieldNameRequired"),
        cancel: t("action.cancel"),
        directoryCreateLabel: t("action.new"),
        delete: t("action.delete"),
        undoDelete: t("action.undoDelete"),
        save: t("action.save"),
        saving: t("action.saving"),
        readOnlyNotice: t("readOnlyNotice"),
        saveError: t("error.save"),
        createError: t("error.create"),
        deleteError: t("error.delete"),
        deleteBlockedDetail: t("error.deleteBlockedDetail"),
        discardConfirm: t("discardConfirm")
      }}
    />
  );
}
