import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { FieldConfigurationClient } from "@/component/configuration/field-configuration-client";
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
  const tState = await getTranslations("State");

  return (
    <Suspense
      fallback={
        <div className="ui-panel ui-empty-panel">
          {tState("loadingDescription")}
        </div>
      }
    >
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
          fieldNameLabel: t("section.fieldName.label"),
          fieldNameHint: t("section.fieldName.hint"),
          fieldNameRequired: t("error.fieldNameRequired"),
          sectionInfoTitle: t("section.info.title"),
          sectionInfoDescription: t("section.info.description"),
          infoFieldNameRegisteredLabel: t("section.info.fieldNameRegisteredLabel"),
          infoFriendlyTypeLabel: t("section.info.friendlyTypeLabel"),
          infoCreateLead: t("section.info.createLead"),
          infoCreateHint: t("section.info.createHint"),
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
    </Suspense>
  );
}
