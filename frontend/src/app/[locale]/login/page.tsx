import Script from "next/script";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { GoogleSignInPanel } from "@/component/auth/google-sign-in-panel";
import { LoginLocaleBar } from "@/component/i18n/login-locale-bar";
import { Badge } from "@/component/ui/badge";
import {
  AuditIcon,
  SparkIcon,
  ValoraMark,
  WorkflowIcon
} from "@/component/ui/ui-icons";
import { getAuthSession } from "@/lib/auth/server-session";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({
  params,
  searchParams
}: LoginPageProps) {
  const { locale } = await params;
  const { reason } = await searchParams;
  const t = await getTranslations("LoginPage");
  const authSession = await getAuthSession();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (authSession) {
    redirect(`/${locale}/app`);
  }

  const noticeMessage =
    reason === "signed_out"
      ? t("notice.signedOut")
      : reason === "auth_required"
        ? t("notice.authRequired")
        : null;

  return (
    <main className="ui-shell relative min-h-screen">
      <LoginLocaleBar currentLocale={locale} />
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <section className="ui-auth-layout">
        <div className="ui-panel ui-auth-hero">
          <div className="flex items-center gap-4">
            <div className="ui-auth-mark">
              <ValoraMark />
            </div>
            <Badge>
              {t("eyebrow")}
            </Badge>
          </div>

          <div className="space-y-4">
            <h1 className="ui-header-title ui-title-page max-w-3xl lg:text-[3.3rem]">
              {t("title")}
            </h1>
            <p className="ui-page-description max-w-2xl text-base leading-8">
              {t("description")}
            </p>
          </div>

          <div className="ui-auth-card-grid">
            <article className="ui-card ui-auth-card">
              <div className="ui-icon-badge">
                <SparkIcon className="h-[1.05rem] w-[1.05rem]" />
              </div>
              <h2 className="ui-header-title ui-title-section">
                {t("cards.workspace.title")}
              </h2>
              <p className="ui-copy-body">
                {t("cards.workspace.description")}
              </p>
            </article>

            <article className="ui-card ui-auth-card">
              <div className="ui-icon-badge ui-icon-badge-attention">
                <AuditIcon className="h-[1.05rem] w-[1.05rem]" />
              </div>
              <h2 className="ui-header-title ui-title-section">
                {t("cards.traceability.title")}
              </h2>
              <p className="ui-copy-body">
                {t("cards.traceability.description")}
              </p>
            </article>

            <article className="ui-card ui-auth-card">
              <div className="ui-icon-badge">
                <WorkflowIcon className="h-[1.05rem] w-[1.05rem]" />
              </div>
              <h2 className="ui-header-title ui-title-section">
                {t("cards.nextStep.title")}
              </h2>
              <p className="ui-copy-body">
                {t("cards.nextStep.description")}
              </p>
            </article>
          </div>
        </div>

        <section className="ui-panel ui-auth-panel">
          <div className="ui-section-copy">
            <h2 className="ui-header-title ui-title-section text-2xl">
              {t("form.title")}
            </h2>
            <p className="ui-copy-body">
              {t("form.description")}
            </p>
          </div>

          {noticeMessage ? (
            <div className="ui-notice-attention px-4 py-3 text-sm">
              {noticeMessage}
            </div>
          ) : null}

          <GoogleSignInPanel
            locale={locale}
            clientId={googleClientId}
            buttonLabel={t("form.submitIdle")}
            buttonPendingLabel={t("form.submitPending")}
            helperText={t("form.helper")}
            unavailableText={t("form.googleUnavailable")}
            genericErrorText={t("form.error")}
            rememberMeLabel={t("form.rememberMeLabel")}
          />

          <div className="ui-auth-policy">{t("form.accessPolicy")}</div>
        </section>
      </section>
    </main>
  );
}
