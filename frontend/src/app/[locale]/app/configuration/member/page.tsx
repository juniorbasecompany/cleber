import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MemberConfigurationClient } from "@/component/configuration/member-configuration-client";
import { getTenantMemberDirectory } from "@/lib/auth/server-session";

type MemberConfigurationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MemberConfigurationPage({
  params
}: MemberConfigurationPageProps) {
  const { locale } = await params;
  const memberDirectory = await getTenantMemberDirectory();

  if (!memberDirectory) {
    redirect(`/${locale}/login?reason=auth_required`);
  }

  const t = await getTranslations("MemberConfigurationPage");
  const tState = await getTranslations("State");

  const copy = {
    title: t("title"),
    description: t("description"),
    empty: t("list.empty"),
    sectionIdleTitle: t("section.idle.title"),
    sectionIdleDescription: t("section.idle.description"),
    sectionIdleSelectLead: t("section.idle.selectLead"),
    sectionIdleSelectHint: t("section.idle.selectHint"),
    sectionIdleEmptyLead: t("section.idle.emptyLead"),
    sectionIdleEmptyHint: t("section.idle.emptyHint"),
    historyTitle: t("history.title"),
    historyDescription: t("history.description"),
    displayNameLabel: t("section.profile.displayNameLabel"),
    displayNameHint: t("section.profile.displayNameHint"),
    nameLabel: t("section.profile.nameLabel"),
    nameHint: t("section.profile.nameHint"),
    sectionAccessTitle: t("section.access.title"),
    sectionAccessDescription: t("section.access.description"),
    emailLabel: t("section.access.emailLabel"),
    inviteEmailHint: t("section.invite.emailFieldHint"),
    memberEmailHint: t("section.access.memberEmailHint"),
    roleLabel: t("section.access.roleLabel"),
    statusLabel: t("section.access.statusLabel"),
    accountLinked: t("section.access.accountLinked"),
    accountPending: t("section.access.accountPending"),
    accountTopicLabel: t("section.access.accountTopicLabel"),
    cancel: t("action.cancel"),
    directoryCreateLabel: t("action.new"),
    delete: t("action.delete"),
    undoDelete: t("action.undoDelete"),
    save: t("action.save"),
    saving: t("action.saving"),
    readOnlyNotice: t("readOnlyNotice"),
    protectedRecordNotice: t("protectedRecordNotice"),
    saveError: t("error.save"),
    createError: t("error.create"),
    deleteError: t("error.delete"),
    validationError: t("error.validation"),
    emailValidationError: t("error.emailValidation"),
    inviteSectionTitle: t("section.invite.title"),
    inviteSectionDescription: t("section.invite.description"),
    inviteCreateLead: t("section.invite.createLead"),
    inviteCreateHint: t("section.invite.createHint"),
    discardConfirm: t("discardConfirm"),
    roleLabels: {
      master: t("role.master"),
      admin: t("role.admin"),
      member: t("role.member")
    },
    statusLabels: {
      ACTIVE: t("statusValue.ACTIVE"),
      PENDING: t("statusValue.PENDING"),
      DISABLED: t("statusValue.DISABLED")
    }
  };

  return (
    <Suspense
      fallback={
        <div className="ui-panel ui-empty-panel">
          {tState("loadingDescription")}
        </div>
      }
    >
      <MemberConfigurationClient
        locale={locale}
        initialDirectory={memberDirectory}
        copy={copy}
      />
    </Suspense>
  );
}
