import { getTranslations } from "next-intl/server";

import { InfoCard } from "@/component/app-shell/info-card";
import { PageHeader } from "@/component/app-shell/page-header";
import { StatusPanel } from "@/component/app-shell/status-panel";
import { SetupStepCard } from "@/component/home/setup-step-card";
import {
  BuildingIcon,
  ScopeIcon,
  UsersIcon
} from "@/component/ui/ui-icons";

type ConfigurationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ConfigurationPage({ params }: ConfigurationPageProps) {
  const { locale } = await params;
  const t = await getTranslations("ConfigurationPage");
  const tenantEditorHref = `/${locale}/app/configuration/tenant`;
  const memberEditorHref = `/${locale}/app/configuration/member`;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actionSlot={
          <StatusPanel
            title={t("status.title")}
            description={t("status.description")}
            tone="neutral"
          />
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <InfoCard
          title={t("cards.organization.title")}
          description={t("cards.organization.description")}
          iconSlot={<BuildingIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
        <InfoCard
          title={t("cards.member.title")}
          description={t("cards.member.description")}
          iconSlot={<UsersIcon className="h-[1.05rem] w-[1.05rem]" />}
          actionHref={memberEditorHref}
          actionLabel={t("openMemberEditor")}
        />
        <InfoCard
          title={t("cards.scope.title")}
          description={t("cards.scope.description")}
          iconSlot={<ScopeIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
      </section>

      <section className="ui-panel grid gap-4 p-6">
        <SetupStepCard
          title={t("queue.organization.title")}
          description={t("queue.organization.description")}
          statusLabel={t("queue.organization.status")}
          tone="attention"
          actionHref={tenantEditorHref}
          actionLabel={t("openTenantEditor")}
          iconSlot={<BuildingIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
        <SetupStepCard
          title={t("queue.member.title")}
          description={t("queue.member.description")}
          statusLabel={t("queue.member.status")}
          tone="attention"
          actionHref={memberEditorHref}
          actionLabel={t("openMemberEditor")}
          iconSlot={<UsersIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
        <SetupStepCard
          title={t("queue.scope.title")}
          description={t("queue.scope.description")}
          statusLabel={t("queue.scope.status")}
          tone="neutral"
          iconSlot={<ScopeIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
      </section>
    </section>
  );
}
