import { getTranslations } from "next-intl/server";

import { InfoCard } from "@/component/app-shell/info-card";
import { PageHeader } from "@/component/app-shell/page-header";
import { BuildingIcon, RulerIcon, ScopeIcon, UsersIcon } from "@/component/ui/ui-icons";

type ConfigurationPageProps = {
    params: Promise<{ locale: string }>;
};

export default async function ConfigurationPage({ params }: ConfigurationPageProps) {
    const { locale } = await params;
    const t = await getTranslations("ConfigurationPage");
    const tenantEditorHref = `/${locale}/app/configuration/tenant`;
    const memberEditorHref = `/${locale}/app/configuration/member`;
    const scopeEditorHref = `/${locale}/app/configuration/scope`;
    const fieldEditorHref = `/${locale}/app/configuration/field`;

    return (
        <section className="ui-page-stack">
            <PageHeader title={t("title")} description={t("description")} />

            <section className="ui-grid-cards-4">
                <InfoCard
                    title={t("cards.organization.title")}
                    description={t("cards.organization.description")}
                    iconSlot={<BuildingIcon className="ui-icon" />}
                    actionHref={tenantEditorHref}
                    actionLabel={t("openTenantEditor")}
                />
                <InfoCard
                    title={t("cards.member.title")}
                    description={t("cards.member.description")}
                    iconSlot={<UsersIcon className="ui-icon" />}
                    actionHref={memberEditorHref}
                    actionLabel={t("openMemberEditor")}
                />
                <InfoCard
                    title={t("cards.scope.title")}
                    description={t("cards.scope.description")}
                    iconSlot={<ScopeIcon className="ui-icon" />}
                    actionHref={scopeEditorHref}
                    actionLabel={t("openScopeEditor")}
                />
                <InfoCard
                    title={t("cards.field.title")}
                    description={t("cards.field.description")}
                    iconSlot={<RulerIcon className="ui-icon" />}
                    actionHref={fieldEditorHref}
                    actionLabel={t("openFieldEditor")}
                />
            </section>
        </section>
    );
}
