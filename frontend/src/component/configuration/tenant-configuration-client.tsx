"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

import { PageHeader } from "@/component/app-shell/page-header";
import { StatusPanel } from "@/component/app-shell/status-panel";
import type { TenantCurrentResponse } from "@/lib/auth/types";

export type TenantConfigurationCopy = {
  eyebrow: string;
  title: string;
  description: string;
  statusTitle: string;
  statusDescription: string;
  tabGeneral: string;
  tabHistory: string;
  tabListAriaLabel: string;
  historyTitle: string;
  historyDescription: string;
  sectionDisplayTitle: string;
  sectionDisplayDescription: string;
  displayNameLabel: string;
  displayNameHint: string;
  sectionLegalTitle: string;
  sectionLegalDescription: string;
  legalNameLabel: string;
  legalNameHint: string;
  metadataIdLabel: string;
  save: string;
  saving: string;
  back: string;
  readOnlyNotice: string;
  savedNotice: string;
  saveError: string;
  validationError: string;
  discardConfirm: string;
};

type TenantConfigurationClientProps = {
  locale: string;
  initialTenant: TenantCurrentResponse;
  copy: TenantConfigurationCopy;
};

function normalizeTab(raw: string | null): "general" | "history" {
  return raw === "history" ? "history" : "general";
}

function parseErrorDetail(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (typeof first?.msg === "string" && first.msg.trim()) {
      return first.msg;
    }
  }
  return fallback;
}

export function TenantConfigurationClient({
  locale,
  initialTenant,
  copy
}: TenantConfigurationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = normalizeTab(searchParams.get("tab"));

  const configurationPath = `/${locale}/app/configuration`;
  const tenantPath = `/${locale}/app/configuration/tenant`;

  const [tenant, setTenant] = useState(initialTenant);
  const [displayName, setDisplayName] = useState(initialTenant.display_name);
  const [legalName, setLegalName] = useState(initialTenant.name);
  const [baseline, setBaseline] = useState({
    display: initialTenant.display_name,
    legal: initialTenant.name
  });

  useEffect(() => {
    setTenant(initialTenant);
    setDisplayName(initialTenant.display_name);
    setLegalName(initialTenant.name);
    setBaseline({
      display: initialTenant.display_name,
      legal: initialTenant.name
    });
  }, [initialTenant]);

  const [fieldError, setFieldError] = useState<{
    displayName?: string;
    legalName?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(() => {
    return (
      displayName.trim() !== baseline.display.trim() ||
      legalName.trim() !== baseline.legal.trim()
    );
  }, [baseline.display, baseline.legal, displayName, legalName]);

  const setTab = useCallback(
    (next: "general" | "history") => {
      const url =
        next === "history"
          ? `${tenantPath}?tab=history`
          : tenantPath;
      router.replace(url);
    },
    [router, tenantPath]
  );

  const validate = useCallback(() => {
    const nextError: { displayName?: string; legalName?: string } = {};
    if (!displayName.trim()) {
      nextError.displayName = copy.validationError;
    }
    if (!legalName.trim()) {
      nextError.legalName = copy.validationError;
    }
    setFieldError(nextError);
    return Object.keys(nextError).length === 0;
  }, [copy.validationError, displayName, legalName]);

  const handleSave = useCallback(async () => {
    setFormError(null);
    setSaveSuccess(false);
    if (!validate()) {
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/tenant/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          name: legalName.trim()
        })
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(parseErrorDetail(data, copy.saveError));
        return;
      }
      const updated = data as TenantCurrentResponse;
      setTenant(updated);
      setDisplayName(updated.display_name);
      setLegalName(updated.name);
      setBaseline({
        display: updated.display_name,
        legal: updated.name
      });
      setSaveSuccess(true);
      router.refresh();
    } catch {
      setFormError(copy.saveError);
    } finally {
      setIsSaving(false);
    }
  }, [
    copy.saveError,
    displayName,
    legalName,
    router,
    validate
  ]);

  const handleBack = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (isDirty && !window.confirm(copy.discardConfirm)) {
        event.preventDefault();
      }
    },
    [copy.discardConfirm, isDirty]
  );

  const pageTitle = tenant.display_name.trim() || copy.title;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={pageTitle}
        description={copy.description}
        actionSlot={
          <StatusPanel
            title={copy.statusTitle}
            description={copy.statusDescription}
            tone="neutral"
          />
        }
      />

      <div
        className="ui-panel flex flex-wrap gap-1 p-1"
        role="tablist"
        aria-label={copy.tabListAriaLabel}
      >
        <button
          type="button"
          role="tab"
          id="tenant-tab-general"
          aria-selected={tab === "general"}
          aria-controls="tenant-panel-general"
          className={`rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium transition-colors ${
            tab === "general"
              ? "bg-[var(--color-surface-muted)] text-[var(--color-text)] shadow-[var(--shadow-xs)]"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]/60"
          }`}
          onClick={() => setTab("general")}
        >
          {copy.tabGeneral}
        </button>
        <button
          type="button"
          role="tab"
          id="tenant-tab-history"
          aria-selected={tab === "history"}
          aria-controls="tenant-panel-history"
          className={`rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-[var(--color-surface-muted)] text-[var(--color-text)] shadow-[var(--shadow-xs)]"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]/60"
          }`}
          onClick={() => setTab("history")}
        >
          {copy.tabHistory}
        </button>
      </div>

      {tab === "general" ? (
        <div
          id="tenant-panel-general"
          role="tabpanel"
          aria-labelledby="tenant-tab-general"
          className="flex flex-col gap-6"
        >
          <div className="ui-panel flex flex-col gap-6 px-6 py-6">
            {!tenant.can_edit ? (
              <div className="ui-notice-attention px-4 py-3 text-sm">
                {copy.readOnlyNotice}
              </div>
            ) : null}

            {saveSuccess ? (
              <div className="ui-tone-positive rounded-[var(--radius-card)] border px-4 py-3 text-sm">
                {copy.savedNotice}
              </div>
            ) : null}

            {formError ? (
              <div className="ui-notice-danger px-4 py-3 text-sm">{formError}</div>
            ) : null}

            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-medium text-[var(--color-text)]">
                  {copy.sectionDisplayTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">
                  {copy.sectionDisplayDescription}
                </p>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                  htmlFor="tenant-display-name"
                >
                  {copy.displayNameLabel}
                </label>
                <input
                  id="tenant-display-name"
                  className="ui-input w-full max-w-xl"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    setFieldError((previous) => ({
                      ...previous,
                      displayName: undefined
                    }));
                    setSaveSuccess(false);
                  }}
                  disabled={!tenant.can_edit}
                  autoComplete="organization"
                  aria-invalid={Boolean(fieldError.displayName)}
                  aria-describedby="tenant-display-name-hint"
                />
                <p
                  id="tenant-display-name-hint"
                  className="text-xs text-[var(--color-text-subtle)]"
                >
                  {copy.displayNameHint}
                </p>
                {fieldError.displayName ? (
                  <p className="text-sm text-[var(--color-danger-text)]">
                    {fieldError.displayName}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-4 border-t border-[var(--color-border)] pt-6">
              <div>
                <h2 className="text-sm font-medium text-[var(--color-text)]">
                  {copy.sectionLegalTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">
                  {copy.sectionLegalDescription}
                </p>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                  htmlFor="tenant-legal-name"
                >
                  {copy.legalNameLabel}
                </label>
                <input
                  id="tenant-legal-name"
                  className="ui-input w-full max-w-xl"
                  value={legalName}
                  onChange={(event) => {
                    setLegalName(event.target.value);
                    setFieldError((previous) => ({
                      ...previous,
                      legalName: undefined
                    }));
                    setSaveSuccess(false);
                  }}
                  disabled={!tenant.can_edit}
                  autoComplete="organization-title"
                  aria-invalid={Boolean(fieldError.legalName)}
                  aria-describedby="tenant-legal-name-hint"
                />
                <p
                  id="tenant-legal-name-hint"
                  className="text-xs text-[var(--color-text-subtle)]"
                >
                  {copy.legalNameHint}
                </p>
                {fieldError.legalName ? (
                  <p className="text-sm text-[var(--color-danger-text)]">
                    {fieldError.legalName}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="border-t border-[var(--color-border)] pt-6">
              <p className="text-xs text-[var(--color-text-subtle)]">
                <span className="font-medium text-[var(--color-text-muted)]">
                  {copy.metadataIdLabel}
                </span>{" "}
                {tenant.id}
              </p>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-6">
              <button
                type="button"
                className="ui-button-primary"
                onClick={() => void handleSave()}
                disabled={!tenant.can_edit || isSaving || !isDirty}
              >
                {isSaving ? copy.saving : copy.save}
              </button>
              <Link
                href={configurationPath}
                className="ui-button-secondary inline-flex items-center justify-center"
                onClick={handleBack}
              >
                {copy.back}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="tenant-panel-history"
          role="tabpanel"
          aria-labelledby="tenant-tab-history"
          className="ui-panel px-6 py-6"
        >
          <h2 className="text-sm font-medium text-[var(--color-text)]">
            {copy.historyTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-subtle)]">
            {copy.historyDescription}
          </p>
        </div>
      )}
    </section>
  );
}
