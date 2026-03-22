import { getTranslations } from "next-intl/server";

import { InfoCard } from "@/component/app-shell/info-card";
import { PageHeader } from "@/component/app-shell/page-header";
import { StatusPanel } from "@/component/app-shell/status-panel";
import { QuickActionCard } from "@/component/home/quick-action-card";
import { SetupStepCard } from "@/component/home/setup-step-card";
import {
  BuildingIcon,
  GlobeIcon,
  ScopeIcon,
  SparkIcon,
  UsersIcon,
  WorkflowIcon
} from "@/component/ui/ui-icons";

type AppHomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AppHomePage({ params }: AppHomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("HomePage");

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
            tone="attention"
          />
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <InfoCard
          title={t("context.workspace.title")}
          description={t("context.workspace.description")}
          iconSlot={<BuildingIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
        <InfoCard
          title={t("context.locale.title")}
          description={t("context.locale.description")}
          iconSlot={<GlobeIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
        <InfoCard
          title={t("context.entryFlow.title")}
          description={t("context.entryFlow.description")}
          iconSlot={<WorkflowIcon className="h-[1.05rem] w-[1.05rem]" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="ui-panel flex flex-col gap-5 p-6">
          <div className="space-y-2">
            <h2 className="ui-header-title text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
              {t("setup.title")}
            </h2>
            <p className="text-sm leading-6 text-[var(--color-text-subtle)]">
              {t("setup.description")}
            </p>
          </div>

          <div className="grid gap-4">
            <SetupStepCard
              title={t("setup.steps.organization.title")}
              description={t("setup.steps.organization.description")}
              statusLabel={t("setup.steps.organization.status")}
              tone="attention"
              iconSlot={<BuildingIcon className="h-[1.05rem] w-[1.05rem]" />}
            />
            <SetupStepCard
              title={t("setup.steps.member.title")}
              description={t("setup.steps.member.description")}
              statusLabel={t("setup.steps.member.status")}
              tone="neutral"
              iconSlot={<UsersIcon className="h-[1.05rem] w-[1.05rem]" />}
            />
            <SetupStepCard
              title={t("setup.steps.scope.title")}
              description={t("setup.steps.scope.description")}
              statusLabel={t("setup.steps.scope.status")}
              tone="neutral"
              iconSlot={<ScopeIcon className="h-[1.05rem] w-[1.05rem]" />}
            />
          </div>
        </div>

        <div className="ui-panel flex flex-col gap-5 p-6">
          <div className="space-y-2">
            <h2 className="ui-header-title text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
              {t("quickAction.title")}
            </h2>
            <p className="text-sm leading-6 text-[var(--color-text-subtle)]">
              {t("quickAction.description")}
            </p>
          </div>

          <div className="grid gap-4">
            <QuickActionCard
              title={t("quickAction.configuration.title")}
              description={t("quickAction.configuration.description")}
              href={`/${locale}/app/configuration`}
              actionLabel={t("quickAction.configuration.action")}
              iconSlot={<SparkIcon className="h-[1.05rem] w-[1.05rem]" />}
            />
            <QuickActionCard
              title={t("quickAction.plan.title")}
              description={t("quickAction.plan.description")}
              href={`/${locale}/app/configuration`}
              actionLabel={t("quickAction.plan.action")}
              iconSlot={<WorkflowIcon className="h-[1.05rem] w-[1.05rem]" />}
            />
          </div>
        </div>
      </section>
    </section>
  );
}
