"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    directoryEditorCanSubmitForDirectoryEditor,
    directoryEditorSaveDisabled
} from "@/component/configuration/configuration-directory-editor-policy";
import { ConfigurationDirectoryEditorShell } from "@/component/configuration/configuration-directory-editor-shell";
import { ConfigurationInfoSection } from "@/component/configuration/configuration-info-section";
import { ConfigurationDirectoryCreateButton } from "@/component/configuration/configuration-directory-create-button";
import { EditorPanelFlashOverlay } from "@/component/configuration/editor-panel-flash-overlay";
import { useEditorPanelFlash } from "@/component/configuration/use-editor-panel-flash";
import { useReplaceConfigurationPath } from "@/component/configuration/use-replace-configuration-path";
import type {
    TenantScopeActionDirectoryResponse,
    TenantScopeActionRecord,
    TenantScopeRecord
} from "@/lib/auth/types";
import type { LabelLang } from "@/lib/i18n/label-lang";
import { parseErrorDetail } from "@/lib/api/parse-error-detail";

export type ActionConfigurationCopy = {
    title: string;
    description: string;
    empty: string;
    emptyScope: string;
    missingCurrentScope: string;
    loadError: string;
    historyTitle: string;
    historyDescription: string;
    actionNameLabel: string;
    actionNameHint: string;
    actionNameRequired: string;
    sectionInfoTitle: string;
    sectionInfoDescription: string;
    infoActionNameRegisteredLabel: string;
    infoCreateLead: string;
    infoCreateHint: string;
    cancel: string;
    directoryCreateLabel: string;
    delete: string;
    undoDelete: string;
    save: string;
    saving: string;
    readOnlyNotice: string;
    saveError: string;
    createError: string;
    deleteError: string;
    deleteBlockedDetail: string;
    discardConfirm: string;
};

type ActionConfigurationClientProps = {
    locale: string;
    labelLang: LabelLang;
    currentScope: TenantScopeRecord | null;
    hasAnyScope: boolean;
    initialActionDirectory: TenantScopeActionDirectoryResponse | null;
    copy: ActionConfigurationCopy;
};

type ActionSelectionKey = number | "new" | null;

function parseSelectedActionKey(raw: string | null): ActionSelectionKey {
    if (!raw) {
        return null;
    }

    if (raw === "new") {
        return "new";
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
}

function resolveSelectedActionKey(
    itemList: TenantScopeActionRecord[],
    preferredKey: ActionSelectionKey,
    canCreate: boolean
): ActionSelectionKey {
    if (preferredKey === "new") {
        return canCreate ? "new" : (itemList[0]?.id ?? null);
    }

    if (typeof preferredKey === "number") {
        const found = itemList.find((item) => item.id === preferredKey)?.id;
        if (found != null) {
            return found;
        }
        return canCreate ? "new" : (itemList[0]?.id ?? null);
    }

    if (itemList.length > 0) {
        return itemList[0].id;
    }

    return canCreate ? "new" : null;
}

function isDeleteBlockedDetail(detail: string | null): boolean {
    if (!detail) {
        return false;
    }
    const normalized = detail.toLowerCase();
    return (
        normalized.includes("events reference") ||
        normalized.includes("events referenc")
    );
}

export function ActionConfigurationClient({
    locale,
    labelLang,
    currentScope,
    hasAnyScope,
    initialActionDirectory,
    copy
}: ActionConfigurationClientProps) {
    const tPage = useTranslations("ActionConfigurationPage");
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearchActionKey = parseSelectedActionKey(searchParams.get("action"));

    const configurationPath = `/${locale}/app/configuration`;
    const actionPath = `/${locale}/app/configuration/action`;

    const replacePath = useCallback(
        (nextPath: string) => {
            router.replace(nextPath, { scroll: false });
        },
        [router]
    );

    const [directory, setDirectory] = useState<TenantScopeActionDirectoryResponse | null>(
        initialActionDirectory
    );

    const initialSelectedActionKey =
        initialActionDirectory != null
            ? resolveSelectedActionKey(
                  initialActionDirectory.item_list,
                  initialSearchActionKey,
                  initialActionDirectory.can_edit
              )
            : null;
    const initialSelectedAction =
        typeof initialSelectedActionKey === "number" && initialActionDirectory
            ? initialActionDirectory.item_list.find(
                  (item) => item.id === initialSelectedActionKey
              ) ?? null
            : null;

    const initialActionName = initialSelectedAction?.label_name?.trim() ?? "";

    const [selectedActionId, setSelectedActionId] = useState<number | null>(
        typeof initialSelectedActionKey === "number" ? initialSelectedActionKey : null
    );
    const [isCreateMode, setIsCreateMode] = useState(initialSelectedActionKey === "new");
    const [actionName, setActionName] = useState(
        initialSelectedActionKey === "new" ? "" : initialActionName
    );
    const [baseline, setBaseline] = useState({
        actionName: initialSelectedActionKey === "new" ? "" : initialActionName
    });
    const [fieldError, setFieldError] = useState<{ actionName?: string }>({});
    const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeletePending, setIsDeletePending] = useState(false);
    const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
    const editorPanelElementRef = useRef<HTMLDivElement | null>(null);
    const initialSearchActionKeyRef = useRef<ActionSelectionKey>(initialSearchActionKey);
    const selectedActionKeyRef = useRef<ActionSelectionKey>(initialSelectedActionKey);
    const didResolveInitialUrlRef = useRef(false);

    const selectedAction = useMemo(() => {
        if (isCreateMode) {
            return null;
        }

        return (
            selectedActionId == null
                ? null
                : (directory?.item_list.find((item) => item.id === selectedActionId) ?? null)
        );
    }, [directory?.item_list, isCreateMode, selectedActionId]);

    const selectedActionKey: ActionSelectionKey = isCreateMode ? "new" : selectedAction?.id ?? null;

    useReplaceConfigurationPath(
        actionPath,
        searchParams,
        replacePath,
        "action",
        directory ? (isCreateMode ? "new" : selectedAction?.id ?? null) : null
    );

    const resolveDirectoryTitle = useCallback(
        (item: TenantScopeActionRecord) => {
            const name = item.label_name?.trim();
            if (name && name.length > 0) {
                return name;
            }
            return tPage("list.fallbackTitle", { id: item.id });
        },
        [tPage]
    );

    const editorFlashKey = useMemo(() => {
        if (!directory) {
            return null;
        }

        if (isCreateMode) {
            return "new";
        }

        if (!selectedAction) {
            return null;
        }

        return `id:${String(selectedAction.id)}:ln:${selectedAction.label_name ?? ""}`;
    }, [directory, isCreateMode, selectedAction]);

    const isEditorFlashActive = useEditorPanelFlash(editorPanelElementRef, editorFlashKey);

    useEffect(() => {
        selectedActionKeyRef.current = isCreateMode ? "new" : selectedAction?.id ?? null;
    }, [isCreateMode, selectedAction]);

    const syncFromDirectory = useCallback(
        (
            nextDirectory: TenantScopeActionDirectoryResponse | null,
            preferredKey?: ActionSelectionKey
        ) => {
            if (!nextDirectory) {
                setDirectory(null);
                setIsCreateMode(false);
                setSelectedActionId(null);
                setActionName("");
                setBaseline({ actionName: "" });
                setFieldError({});
                setRequestErrorMessage(null);
                setIsDeletePending(false);
                return null;
            }

            const nextKey = resolveSelectedActionKey(
                nextDirectory.item_list,
                preferredKey ?? null,
                nextDirectory.can_edit
            );
            const nextSelectedAction =
                typeof nextKey === "number"
                    ? nextDirectory.item_list.find((item) => item.id === nextKey) ?? null
                    : null;

            const nextActionName =
                nextSelectedAction?.label_name?.trim() ?? (nextKey === "new" ? "" : "");

            setDirectory(nextDirectory);
            setIsCreateMode(nextKey === "new");
            setSelectedActionId(typeof nextKey === "number" ? nextKey : null);
            setActionName(nextActionName);
            setBaseline({
                actionName: nextActionName
            });
            setFieldError({});
            setRequestErrorMessage(null);
            setIsDeletePending(false);

            return nextKey;
        },
        []
    );

    useEffect(() => {
        const preferredKey = didResolveInitialUrlRef.current
            ? selectedActionKeyRef.current
            : initialSearchActionKeyRef.current;

        didResolveInitialUrlRef.current = true;
        syncFromDirectory(initialActionDirectory, preferredKey);
    }, [initialActionDirectory, syncFromDirectory]);

    const isDirty = useMemo(() => {
        return actionName.trim() !== baseline.actionName.trim() || isDeletePending;
    }, [actionName, baseline.actionName, isDeletePending]);

    const validate = useCallback(() => {
        if (!actionName.trim()) {
            setFieldError({ actionName: copy.actionNameRequired });
            return false;
        }
        setFieldError({});
        return true;
    }, [actionName, copy.actionNameRequired]);

    const handleStartCreate = useCallback(() => {
        if (!directory?.can_edit || isSaving) {
            return;
        }

        if (isCreateMode) {
            return;
        }

        if (isDirty && !window.confirm(copy.discardConfirm)) {
            return;
        }

        syncFromDirectory(directory, "new");
    }, [copy.discardConfirm, directory, isCreateMode, isDirty, isSaving, syncFromDirectory]);

    const handleSelectAction = useCallback(
        (item: TenantScopeActionRecord) => {
            if (!directory) {
                return;
            }

            if (!isCreateMode && item.id === selectedAction?.id) {
                return;
            }

            if (isDirty && !window.confirm(copy.discardConfirm)) {
                return;
            }

            syncFromDirectory(directory, item.id);
        },
        [copy.discardConfirm, directory, isCreateMode, isDirty, selectedAction, syncFromDirectory]
    );

    const handleToggleDelete = useCallback(() => {
        if (isSaving) {
            return;
        }

        setRequestErrorMessage(null);
        setIsDeletePending((previous) => !previous);
    }, [isSaving]);

    const scopeId = currentScope?.id;

    const handleSave = useCallback(async () => {
        setRequestErrorMessage(null);

        if (!directory || scopeId == null) {
            return;
        }

        if (!isDeletePending && !validate()) {
            return;
        }

        setIsSaving(true);
        try {
            if (isCreateMode) {
                const response = await fetch(`/api/auth/tenant/current/scopes/${scopeId}/actions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        label_lang: labelLang,
                        label_name: actionName.trim()
                    })
                });
                const data: unknown = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setRequestErrorMessage(
                        parseErrorDetail(data, copy.createError) ?? copy.createError
                    );
                    return;
                }

                const updatedDirectory = data as TenantScopeActionDirectoryResponse;
                const previousIdSet = new Set(directory.item_list.map((item) => item.id));
                const created = updatedDirectory.item_list.find(
                    (item) => !previousIdSet.has(item.id)
                );
                syncFromDirectory(updatedDirectory, created?.id ?? "new");
                setHistoryRefreshKey((previous) => previous + 1);
                return;
            }

            if (!selectedAction) {
                return;
            }

            const response = await fetch(
                `/api/auth/tenant/current/scopes/${scopeId}/actions/${selectedAction.id}`,
                isDeletePending
                    ? {
                          method: "DELETE"
                      }
                    : {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                              label_lang: labelLang,
                              label_name: actionName.trim()
                          })
                      }
            );
            const data: unknown = await response.json().catch(() => ({}));

            if (!response.ok) {
                const fallback = isDeletePending ? copy.deleteError : copy.saveError;
                const detail = parseErrorDetail(data, fallback) ?? fallback;
                if (isDeletePending && isDeleteBlockedDetail(detail)) {
                    setRequestErrorMessage(copy.deleteBlockedDetail);
                    return;
                }
                setRequestErrorMessage(detail);
                return;
            }

            const updatedDirectory = data as TenantScopeActionDirectoryResponse;
            const nextKeyAfterMutation: ActionSelectionKey = isDeletePending
                ? (updatedDirectory.item_list[0]?.id ??
                  (updatedDirectory.can_edit ? "new" : null))
                : selectedAction.id;
            syncFromDirectory(updatedDirectory, nextKeyAfterMutation);
            setHistoryRefreshKey((previous) => previous + 1);
        } catch {
            setRequestErrorMessage(
                isCreateMode
                    ? copy.createError
                    : isDeletePending
                      ? copy.deleteError
                      : copy.saveError
            );
        } finally {
            setIsSaving(false);
        }
    }, [
        copy.createError,
        copy.deleteBlockedDetail,
        copy.deleteError,
        copy.saveError,
        directory,
        actionName,
        isCreateMode,
        isDeletePending,
        labelLang,
        scopeId,
        selectedAction,
        syncFromDirectory,
        validate
    ]);

    const canEditForm = isCreateMode ? Boolean(directory?.can_edit) : Boolean(directory?.can_edit);
    const canSubmit = directoryEditorCanSubmitForDirectoryEditor({
        isCreateMode,
        isDeletePending,
        canCreate: directory?.can_edit ?? false,
        canEdit: directory?.can_edit ?? false
    });
    const footerErrorMessage =
        requestErrorMessage ?? fieldError.actionName ?? null;

    const asideEmptyMessage = !currentScope
        ? hasAnyScope
            ? copy.missingCurrentScope
            : copy.emptyScope
        : copy.loadError;

    return (
        <ConfigurationDirectoryEditorShell
            headerTitle={copy.title}
            headerDescription={copy.description}
            editorPanelRef={editorPanelElementRef}
            isDeletePending={isDeletePending}
            directoryAside={
                <>
                    {!directory ? (
                        <div className="ui-panel ui-empty-panel">{asideEmptyMessage}</div>
                    ) : null}

                    {directory && !directory.can_edit ? (
                        <div className="ui-notice-attention ui-notice-block">
                            {copy.readOnlyNotice}
                        </div>
                    ) : null}

                    <div className="ui-directory-list">
                        {directory?.can_edit ? (
                            <ConfigurationDirectoryCreateButton
                                label={copy.directoryCreateLabel}
                                active={isCreateMode}
                                disabled={isSaving}
                                onClick={handleStartCreate}
                            />
                        ) : null}

                        {directory?.item_list.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectAction(item)}
                                className="ui-directory-item"
                                data-selected={item.id === selectedAction?.id ? "true" : undefined}
                                data-delete-pending={
                                    item.id === selectedAction?.id && isDeletePending
                                        ? "true"
                                        : undefined
                                }
                            >
                                <p className="ui-directory-title">{resolveDirectoryTitle(item)}</p>
                            </button>
                        ))}

                        {directory && directory.item_list.length === 0 && !directory.can_edit ? (
                            <div className="ui-panel ui-empty-panel ui-panel-body-compact">
                                {copy.empty}
                            </div>
                        ) : null}
                    </div>
                </>
            }
            editorForm={
                directory ? (
                    <>
                        <section className="ui-card ui-form-section ui-border-accent">
                            <EditorPanelFlashOverlay active={isEditorFlashActive} />
                            <div className="ui-field">
                                <label className="ui-field-label" htmlFor="action-display-name">
                                    {copy.actionNameLabel}
                                </label>
                                <input
                                    id="action-display-name"
                                    type="text"
                                    className="ui-input"
                                    value={actionName}
                                    onChange={(event) => {
                                        setActionName(event.target.value);
                                        setFieldError((previous) => ({
                                            ...previous,
                                            actionName: undefined
                                        }));
                                        setRequestErrorMessage(null);
                                    }}
                                    disabled={isDeletePending || !canEditForm}
                                    autoComplete="off"
                                    aria-invalid={Boolean(fieldError.actionName)}
                                />
                                <p className="ui-field-hint">{copy.actionNameHint}</p>
                                {fieldError.actionName ? (
                                    <p className="ui-field-error">{fieldError.actionName}</p>
                                ) : null}
                            </div>
                        </section>

                        {!isCreateMode && selectedAction ? (
                            <ConfigurationInfoSection
                                title={copy.sectionInfoTitle}
                                description={copy.sectionInfoDescription}
                            >
                                <ul className="ui-info-topic-list">
                                    <li>
                                        <p className="ui-info-topic-lead">
                                            <span className="ui-info-topic-label">
                                                {copy.infoActionNameRegisteredLabel}
                                            </span>
                                            {": "}
                                            <span className="ui-info-topic-value">
                                                {selectedAction.label_name?.trim() || "-"}
                                            </span>
                                        </p>
                                    </li>
                                </ul>
                            </ConfigurationInfoSection>
                        ) : null}

                        {isCreateMode ? (
                            <ConfigurationInfoSection
                                title={copy.sectionInfoTitle}
                                description={copy.sectionInfoDescription}
                            >
                                <ul className="ui-info-topic-list">
                                    <li>
                                        <p className="ui-info-topic-lead">
                                            <span className="ui-info-topic-label">
                                                {copy.infoCreateLead}
                                            </span>
                                        </p>
                                        <p className="ui-field-hint ui-info-topic-hint">
                                            {copy.infoCreateHint}
                                        </p>
                                    </li>
                                </ul>
                            </ConfigurationInfoSection>
                        ) : null}
                    </>
                ) : (
                    <div className="ui-panel ui-empty-panel">{asideEmptyMessage}</div>
                )
            }
            history={{
                headingId: "action-history-heading",
                title: copy.historyTitle,
                description: copy.historyDescription,
                tableName: "action",
                refreshKey: historyRefreshKey
            }}
            footer={{
                configurationPath,
                cancelLabel: copy.cancel,
                discardConfirm: copy.discardConfirm,
                isDirty,
                footerErrorMessage,
                onSave: () => void handleSave(),
                saveDisabled: directoryEditorSaveDisabled({
                    hasEditableContext: Boolean(directory && selectedActionKey),
                    canSubmit,
                    isSaving,
                    isDirty
                }),
                saveLabel: copy.save,
                savingLabel: copy.saving,
                isSaving,
                dangerAction:
                    directory && !isCreateMode && selectedAction ? (
                        <button
                            type="button"
                            className="ui-button-danger"
                            onClick={handleToggleDelete}
                            disabled={isSaving}
                        >
                            {isDeletePending ? copy.undoDelete : copy.delete}
                        </button>
                    ) : null
            }}
        />
    );
}
