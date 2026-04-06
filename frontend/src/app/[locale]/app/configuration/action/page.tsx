import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ActionConfigurationClient } from "@/component/configuration/action-configuration-client";
import {
  getAuthSession,
  getTenantScopeDirectory,
  getTenantScopeActionDirectory
} from "@/lib/auth/server-session";
import { mapAppLocaleToLabelLang } from "@/lib/i18n/label-lang";

type ActionConfigurationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ActionConfigurationPage({ params }: ActionConfigurationPageProps) {
  const { locale } = await params;
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
  const actionDirectory =
    currentScope != null
      ? await getTenantScopeActionDirectory(currentScope.id, labelLang)
      : null;

  const t = await getTranslations("ActionConfigurationPage");
  const tState = await getTranslations("State");

  return (
    <Suspense
      fallback={
        <div className="ui-panel ui-empty-panel">
          {tState("loadingDescription")}
        </div>
      }
    >
      <ActionConfigurationClient
        locale={locale}
        labelLang={labelLang}
        currentScope={currentScope}
        hasAnyScope={scopeDirectory.item_list.length > 0}
        initialActionDirectory={actionDirectory}
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
          actionNameLabel: t("section.actionName.label"),
          actionNameHint: t("section.actionName.hint"),
          recurrenceLabel: t("section.recurrence.label"),
          recurrenceHint: t("section.recurrence.hint"),
          actionNameRequired: t("error.actionNameRequired"),
          cancel: t("buttons.cancel"),
          directoryCreateLabel: t("buttons.new"),
          delete: t("buttons.delete"),
          undoDelete: t("buttons.undoDelete"),
          save: t("buttons.save"),
          saving: t("buttons.saving"),
          readOnlyNotice: t("readOnlyNotice"),
          saveError: t("error.save"),
          createError: t("error.create"),
          deleteError: t("error.delete"),
          deleteBlockedDetail: t("error.deleteBlockedDetail"),
          discardConfirm: t("discardConfirm")
        }}
      />
    </Suspense>
  );
}
