"use client";

import { useTranslations } from "next-intl";

type AppErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppErrorPage({ error, reset }: AppErrorPageProps) {
  const t = useTranslations("State");

  return (
    <section className="ui-notice-danger rounded-[var(--radius-panel)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-3">
        <h2 className="ui-header-title text-xl font-semibold tracking-[-0.03em]">
          {t("errorTitle")}
        </h2>
        <p className="max-w-2xl text-sm leading-6 opacity-90">
          {t("errorDescription")}
        </p>
        {error.message ? (
          <p className="ui-card ui-tone-danger px-4 py-3 text-sm leading-6">
            {error.message}
          </p>
        ) : null}
        <div>
          <button
            type="button"
            onClick={reset}
            className="ui-button-danger text-sm font-medium transition"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    </section>
  );
}
