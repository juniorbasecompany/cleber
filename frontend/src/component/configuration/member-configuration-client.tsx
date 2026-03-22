"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";

import { PageHeader } from "@/component/app-shell/page-header";
import { StatusPanel } from "@/component/app-shell/status-panel";
import { PreviewIcon, UsersIcon } from "@/component/ui/ui-icons";
import type {
  TenantMemberDirectoryResponse,
  TenantMemberRecord
} from "@/lib/auth/types";

type MemberStatusKey = "ACTIVE" | "PENDING" | "DISABLED";

type MemberConfigurationCopy = {
  eyebrow: string;
  title: string;
  description: string;
  statusTitle: string;
  statusDescription: string;
  listTitle: string;
  listDescription: string;
  empty: string;
  sectionProfileTitle: string;
  sectionProfileDescription: string;
  displayNameLabel: string;
  displayNameHint: string;
  nameLabel: string;
  nameHint: string;
  sectionAccessTitle: string;
  sectionAccessDescription: string;
  emailLabel: string;
  emailHint: string;
  roleLabel: string;
  statusLabel: string;
  accountLinked: string;
  accountPending: string;
  accessManagedNotice: string;
  memberIdLabel: string;
  accountIdLabel: string;
  cancel: string;
  save: string;
  saving: string;
  readOnlyNotice: string;
  savedNotice: string;
  saveError: string;
  validationError: string;
  discardConfirm: string;
  selectPrompt: string;
  roleLabels: Record<"master" | "admin" | "member", string>;
  statusLabels: Record<MemberStatusKey, string>;
};

type MemberConfigurationClientProps = {
  locale: string;
  initialDirectory: TenantMemberDirectoryResponse;
  copy: MemberConfigurationCopy;
};

const memberStatusValueByKey: Record<MemberStatusKey, number> = {
  ACTIVE: 1,
  PENDING: 2,
  DISABLED: 3
};

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

function resolveMemberLabel(member: TenantMemberRecord) {
  return member.display_name?.trim() || member.name?.trim() || member.email;
}

function normalizeStatusKey(raw: string): MemberStatusKey {
  if (raw === "ACTIVE" || raw === "PENDING" || raw === "DISABLED") {
    return raw;
  }

  return "DISABLED";
}

function getStatusToneClass(status: MemberStatusKey) {
  if (status === "ACTIVE") {
    return "ui-tone-positive";
  }

  if (status === "PENDING") {
    return "ui-tone-attention";
  }

  return "ui-tone-danger";
}

export function MemberConfigurationClient({
  locale,
  initialDirectory,
  copy
}: MemberConfigurationClientProps) {
  const configurationPath = `/${locale}/app/configuration`;

  const [directory, setDirectory] = useState(initialDirectory);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(
    initialDirectory.item_list[0]?.id ?? null
  );
  const [displayName, setDisplayName] = useState(
    initialDirectory.item_list[0]?.display_name ?? ""
  );
  const [name, setName] = useState(initialDirectory.item_list[0]?.name ?? "");
  const [roleValue, setRoleValue] = useState(initialDirectory.item_list[0]?.role ?? 3);
  const [statusKey, setStatusKey] = useState<MemberStatusKey>(
    normalizeStatusKey(initialDirectory.item_list[0]?.status ?? "DISABLED")
  );
  const [baseline, setBaseline] = useState({
    displayName: initialDirectory.item_list[0]?.display_name ?? "",
    name: initialDirectory.item_list[0]?.name ?? "",
    role: initialDirectory.item_list[0]?.role ?? 3,
    status: normalizeStatusKey(initialDirectory.item_list[0]?.status ?? "DISABLED")
  });
  const [fieldError, setFieldError] = useState<{
    displayName?: string;
    name?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const selectedMemberIdRef = useRef<number | null>(selectedMemberId);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-shell-footer-slot"));
  }, []);

  useEffect(() => {
    selectedMemberIdRef.current = selectedMemberId;
  }, [selectedMemberId]);

  const selectedMember = useMemo(() => {
    return (
      directory.item_list.find((item) => item.id === selectedMemberId) ??
      directory.item_list[0] ??
      null
    );
  }, [directory.item_list, selectedMemberId]);

  const syncFromDirectory = useCallback(
    (
      nextDirectory: TenantMemberDirectoryResponse,
      preferredMemberId?: number | null,
      preserveSuccess = false
    ) => {
      const nextSelectedMember =
        nextDirectory.item_list.find((item) => item.id === preferredMemberId) ??
        nextDirectory.item_list[0] ??
        null;

      setDirectory(nextDirectory);
      setSelectedMemberId(nextSelectedMember?.id ?? null);
      setDisplayName(nextSelectedMember?.display_name ?? "");
      setName(nextSelectedMember?.name ?? "");
      setRoleValue(nextSelectedMember?.role ?? 3);
      setStatusKey(normalizeStatusKey(nextSelectedMember?.status ?? "DISABLED"));
      setBaseline({
        displayName: nextSelectedMember?.display_name ?? "",
        name: nextSelectedMember?.name ?? "",
        role: nextSelectedMember?.role ?? 3,
        status: normalizeStatusKey(nextSelectedMember?.status ?? "DISABLED")
      });
      setFieldError({});
      setFormError(null);
      if (!preserveSuccess) {
        setSaveSuccess(false);
      }
    },
    []
  );

  useEffect(() => {
    syncFromDirectory(initialDirectory, selectedMemberIdRef.current);
  }, [initialDirectory, syncFromDirectory]);

  const isDirty = useMemo(() => {
    return (
      displayName.trim() !== baseline.displayName.trim() ||
      name.trim() !== baseline.name.trim() ||
      roleValue !== baseline.role ||
      statusKey !== baseline.status
    );
  }, [baseline.displayName, baseline.name, baseline.role, baseline.status, displayName, name, roleValue, statusKey]);

  const validate = useCallback(() => {
    const nextError: { displayName?: string; name?: string } = {};

    if (!displayName.trim()) {
      nextError.displayName = copy.validationError;
    }

    if (!name.trim()) {
      nextError.name = copy.validationError;
    }

    setFieldError(nextError);
    return Object.keys(nextError).length === 0;
  }, [copy.validationError, displayName, name]);

  const handleSelectMember = useCallback(
    (member: TenantMemberRecord) => {
      if (member.id === selectedMemberId) {
        return;
      }

      if (isDirty && !window.confirm(copy.discardConfirm)) {
        return;
      }

      syncFromDirectory(directory, member.id);
    },
    [copy.discardConfirm, directory, isDirty, selectedMemberId, syncFromDirectory]
  );

  const handleBack = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (isDirty && !window.confirm(copy.discardConfirm)) {
        event.preventDefault();
      }
    },
    [copy.discardConfirm, isDirty]
  );

  const handleSave = useCallback(async () => {
    if (!selectedMember) {
      return;
    }

    setFormError(null);
    setSaveSuccess(false);
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/auth/tenant/current/members/${selectedMember.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            display_name: displayName.trim(),
            name: name.trim(),
            role: roleValue,
            status: memberStatusValueByKey[statusKey]
          })
        }
      );
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(parseErrorDetail(data, copy.saveError));
        return;
      }

      const updatedDirectory = data as TenantMemberDirectoryResponse;
      syncFromDirectory(updatedDirectory, selectedMember.id, true);
      setSaveSuccess(true);
    } catch {
      setFormError(copy.saveError);
    } finally {
      setIsSaving(false);
    }
  }, [
    copy.saveError,
    displayName,
    name,
    roleValue,
    selectedMember,
    statusKey,
    syncFromDirectory,
    validate
  ]);

  const roleOptions = useMemo(
    () => [
      { value: 1, label: copy.roleLabels.master },
      { value: 2, label: copy.roleLabels.admin },
      { value: 3, label: copy.roleLabels.member }
    ],
    [copy.roleLabels.admin, copy.roleLabels.master, copy.roleLabels.member]
  );

  const statusOptions = useMemo(
    () =>
      selectedMember?.account_id == null
        ? [
            { value: "PENDING" as const, label: copy.statusLabels.PENDING },
            { value: "DISABLED" as const, label: copy.statusLabels.DISABLED }
          ]
        : [
            { value: "ACTIVE" as const, label: copy.statusLabels.ACTIVE },
            { value: "DISABLED" as const, label: copy.statusLabels.DISABLED }
          ],
    [
      copy.statusLabels.ACTIVE,
      copy.statusLabels.DISABLED,
      copy.statusLabels.PENDING,
      selectedMember?.account_id
    ]
  );

  const pageTitle = selectedMember ? resolveMemberLabel(selectedMember) : copy.title;

  return (
    <section className="flex flex-col gap-6 pb-56 lg:pb-0">
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

      {directory.item_list.length === 0 ? (
        <div className="ui-panel px-6 py-6 text-sm text-[var(--color-text-muted)]">
          {copy.empty}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(19rem,0.82fr)_minmax(0,1.18fr)]">
          <aside className="ui-panel flex flex-col gap-4 px-5 py-5">
            <div className="flex items-start gap-4">
              <span className="ui-icon-badge">
                <UsersIcon className="h-[1.05rem] w-[1.05rem]" />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                  {copy.listTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">
                  {copy.listDescription}
                </p>
              </div>
            </div>

            {!directory.can_edit ? (
              <div className="ui-notice-attention px-4 py-3 text-sm">
                {copy.readOnlyNotice}
              </div>
            ) : null}

            <div className="grid gap-3">
              {directory.item_list.map((item) => {
                const itemStatusKey = normalizeStatusKey(item.status);
                const roleLabel =
                  copy.roleLabels[item.role_name as keyof typeof copy.roleLabels] ??
                  item.role_name;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMember(item)}
                    className={`rounded-[var(--radius-card)] border px-4 py-4 text-left transition ${
                      item.id === selectedMember?.id
                        ? "border-[rgba(37,117,216,0.2)] bg-[var(--color-accent-soft)]/65 shadow-[var(--shadow-xs)]"
                        : "border-[var(--color-border)] bg-white/72 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-background-muted)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                          {resolveMemberLabel(item)}
                        </p>
                        <p className="mt-1 truncate text-xs text-[var(--color-text-subtle)]">
                          {item.email}
                        </p>
                      </div>
                      <span
                        className={`ui-pill shrink-0 px-2.5 py-1 text-[11px] font-semibold ${getStatusToneClass(itemStatusKey)}`}
                      >
                        {copy.statusLabels[itemStatusKey]}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="ui-tone-neutral rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                        {roleLabel}
                      </span>
                      <span className="ui-tone-neutral rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                        #{item.id}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="ui-panel flex flex-col gap-6 px-6 py-6">
            {saveSuccess ? (
              <div className="ui-tone-positive rounded-[var(--radius-card)] border px-4 py-3 text-sm">
                {copy.savedNotice}
              </div>
            ) : null}

            {formError ? (
              <div className="ui-notice-danger px-4 py-3 text-sm">{formError}</div>
            ) : null}

            {selectedMember ? (
              <>
                {!selectedMember.can_edit ? (
                  <div className="ui-notice-attention px-4 py-3 text-sm">
                    {copy.readOnlyNotice}
                  </div>
                ) : null}

                {selectedMember.can_edit && !selectedMember.can_edit_access ? (
                  <div className="ui-tone-neutral rounded-[var(--radius-card)] border px-4 py-3 text-sm">
                    {copy.accessManagedNotice}
                  </div>
                ) : null}

                <section className="ui-card border-[rgba(37,117,216,0.12)] px-5 py-5">
                  <div className="flex items-start gap-4">
                    <span className="ui-icon-badge">
                      <PreviewIcon className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                        {copy.sectionProfileTitle}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">
                        {copy.sectionProfileDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-[var(--color-text-muted)]"
                        htmlFor="member-display-name"
                      >
                        {copy.displayNameLabel}
                      </label>
                      <input
                        id="member-display-name"
                        className="ui-input w-full"
                        value={displayName}
                        onChange={(event) => {
                          setDisplayName(event.target.value);
                          setFieldError((previous) => ({
                            ...previous,
                            displayName: undefined
                          }));
                          setSaveSuccess(false);
                        }}
                        disabled={!selectedMember.can_edit}
                        autoComplete="nickname"
                        aria-invalid={Boolean(fieldError.displayName)}
                      />
                      <p className="text-xs leading-5 text-[var(--color-text-subtle)]">
                        {copy.displayNameHint}
                      </p>
                      {fieldError.displayName ? (
                        <p className="text-sm text-[var(--color-danger-text)]">
                          {fieldError.displayName}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-[var(--color-text-muted)]"
                        htmlFor="member-name"
                      >
                        {copy.nameLabel}
                      </label>
                      <input
                        id="member-name"
                        className="ui-input w-full"
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                          setFieldError((previous) => ({
                            ...previous,
                            name: undefined
                          }));
                          setSaveSuccess(false);
                        }}
                        disabled={!selectedMember.can_edit}
                        autoComplete="name"
                        aria-invalid={Boolean(fieldError.name)}
                      />
                      <p className="text-xs leading-5 text-[var(--color-text-subtle)]">
                        {copy.nameHint}
                      </p>
                      {fieldError.name ? (
                        <p className="text-sm text-[var(--color-danger-text)]">
                          {fieldError.name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="ui-card border-[rgba(37,117,216,0.12)] px-5 py-5">
                  <div className="flex items-start gap-4">
                    <span className="ui-icon-badge">
                      <UsersIcon className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                        {copy.sectionAccessTitle}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">
                        {copy.sectionAccessDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-3">
                      <label
                        className="text-sm font-semibold text-[var(--color-text-muted)]"
                        htmlFor="member-email"
                      >
                        {copy.emailLabel}
                      </label>
                      <input
                        id="member-email"
                        className="ui-input w-full"
                        value={selectedMember.email}
                        disabled
                        readOnly
                      />
                      <p className="text-xs leading-5 text-[var(--color-text-subtle)]">
                        {copy.emailHint}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-[var(--color-text-muted)]"
                        htmlFor="member-role"
                      >
                        {copy.roleLabel}
                      </label>
                      <select
                        id="member-role"
                        className="ui-input w-full appearance-none"
                        value={roleValue}
                        onChange={(event) => {
                          setRoleValue(Number(event.target.value));
                          setSaveSuccess(false);
                        }}
                        disabled={!selectedMember.can_edit_access}
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-[var(--color-text-muted)]"
                        htmlFor="member-status"
                      >
                        {copy.statusLabel}
                      </label>
                      <select
                        id="member-status"
                        className="ui-input w-full appearance-none"
                        value={statusKey}
                        onChange={(event) => {
                          setStatusKey(normalizeStatusKey(event.target.value));
                          setSaveSuccess(false);
                        }}
                        disabled={!selectedMember.can_edit_access}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/75 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                        {selectedMember.account_id ? copy.accountLinked : copy.accountPending}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                        {selectedMember.account_id
                          ? `#${selectedMember.account_id}`
                          : copy.accountPending}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/70 px-5 py-4 shadow-[var(--shadow-xs)]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                        {copy.memberIdLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                        {selectedMember.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                        {copy.accountIdLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                        {selectedMember.account_id ?? "-"}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="ui-panel px-6 py-6 text-sm text-[var(--color-text-muted)]">
                {copy.selectPrompt}
              </div>
            )}
          </div>
        </div>
      )}

      {portalTarget
        ? createPortal(
            <div className="mx-auto flex w-full max-w-[112rem] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8">
              <div className="flex shrink-0 items-center">
                <Link
                  href={configurationPath}
                  className="ui-button-secondary inline-flex items-center justify-center"
                  onClick={handleBack}
                >
                  {copy.cancel}
                </Link>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="ui-button-primary"
                  onClick={() => void handleSave()}
                  disabled={!selectedMember || !selectedMember.can_edit || isSaving || !isDirty}
                >
                  {isSaving ? copy.saving : copy.save}
                </button>
              </div>
            </div>,
            portalTarget
          )
        : null}
    </section>
  );
}
