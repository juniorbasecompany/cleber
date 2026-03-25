"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import type { CSSProperties, MouseEvent } from "react";
import { createPortal } from "react-dom";

import { PageHeader } from "@/component/app-shell/page-header";
import { HistoryIcon, InfoIcon } from "@/component/ui/ui-icons";
import type {
    TenantScopeDirectoryResponse,
    TenantScopeRecord
} from "@/lib/auth/types";

export type ScopeConfigurationCopy = {
    title: string;
    description: string;
    empty: string;
    historyTitle: string;
    historyDescription: string;
    nameLabel: string;
    nameHint: string;
    displayNameLabel: string;
    displayNameHint: string;
    sectionInfoTitle: string;
    sectionInfoDescription: string;
    infoIdLabel: string;
    infoNameRegisteredLabel: string;
    infoDisplayRegisteredLabel: string;
    infoCanEditLabel: string;
    infoCanDeleteLabel: string;
    infoYes: string;
    infoNo: string;
    infoCreateLead: string;
    infoCreateHint: string;
    cancel: string;
    newScope: string;
    delete: string;
    undoDelete: string;
    save: string;
    saving: string;
    readOnlyNotice: string;
    savedNotice: string;
    createdNotice: string;
    deletedNotice: string;
    saveError: string;
    createError: string;
    deleteError: string;
    validationError: string;
    discardConfirm: string;
    selectPrompt: string;
};

type ScopeConfigurationClientProps = {
    locale: string;
    initialDirectory: TenantScopeDirectoryResponse;
    copy: ScopeConfigurationCopy;
};

type ScopeSelectionKey = number | "new" | null;

const APP_SHELL_MAIN_SCROLL_SELECTOR = ".ui-shell-main-scroll";

function buildScopeListCreateToneStyle(): CSSProperties {
    return {
        "--ui-location-depth": "0",
        "--ui-location-tone-light-share": "100%",
        "--ui-location-tone-dark-share": "0%"
    } as CSSProperties;
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

function resolveScopeLabel(scope: TenantScopeRecord) {
    return scope.name.trim() || scope.display_name.trim() || `#${scope.id}`;
}

function parseSelectedScopeKey(raw: string | null): ScopeSelectionKey {
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

function resolveSelectedScopeKey(
    itemList: TenantScopeRecord[],
    preferredKey: ScopeSelectionKey,
    canCreate: boolean
): ScopeSelectionKey {
    if (preferredKey === "new") {
        return canCreate ? "new" : (itemList[0]?.id ?? null);
    }

    if (typeof preferredKey === "number") {
        return itemList.find((item) => item.id === preferredKey)?.id ?? (itemList[0]?.id ?? null);
    }

    return itemList[0]?.id ?? (canCreate ? "new" : null);
}

function buildScopePath(basePath: string, scopeKey: ScopeSelectionKey) {
    const params = new URLSearchParams();

    if (scopeKey === "new") {
        params.set("scope", "new");
    } else if (typeof scopeKey === "number") {
        params.set("scope", String(scopeKey));
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
}

function isOverflowYScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    const canScroll =
        overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay";
    return canScroll && element.scrollHeight > element.clientHeight;
}

function resolveEditorScrollport(panel: HTMLElement): HTMLElement | null {
    const byShell = panel.closest(APP_SHELL_MAIN_SCROLL_SELECTOR);
    if (byShell instanceof HTMLElement) {
        return byShell;
    }
    let current: HTMLElement | null = panel.parentElement;
    while (current) {
        if (isOverflowYScrollable(current)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}

function isEditorPanelTopVisibleInScrollport(panel: HTMLElement): boolean {
    const scrollport = resolveEditorScrollport(panel);
    const panelRect = panel.getBoundingClientRect();
    const marginTopPx =
        Number.parseFloat(window.getComputedStyle(panel).scrollMarginTop) || 0;
    const epsilonPx = 0.5;

    if (scrollport) {
        const scrollRect = scrollport.getBoundingClientRect();
        return panelRect.top >= scrollRect.top + marginTopPx - epsilonPx;
    }

    return panelRect.top >= marginTopPx - epsilonPx;
}

export function ScopeConfigurationClient({
    locale,
    initialDirectory,
    copy
}: ScopeConfigurationClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearchScopeKey =
        parseSelectedScopeKey(searchParams.get("scope")) ??
        initialDirectory.current_scope_id ??
        null;
    const initialSelectedScopeKey = resolveSelectedScopeKey(
        initialDirectory.item_list,
        initialSearchScopeKey,
        initialDirectory.can_create
    );
    const initialSelectedScope =
        typeof initialSelectedScopeKey === "number"
            ? initialDirectory.item_list.find((item) => item.id === initialSelectedScopeKey) ?? null
            : null;

    const configurationPath = `/${locale}/app/configuration`;
    const scopePath = `/${locale}/app/configuration/scope`;

    const replacePath = useCallback(
        (nextPath: string) => {
            router.replace(nextPath, { scroll: false });
        },
        [router]
    );

    const [directory, setDirectory] = useState(initialDirectory);
    const [selectedScopeId, setSelectedScopeId] = useState<number | null>(
        typeof initialSelectedScopeKey === "number" ? initialSelectedScopeKey : null
    );
    const [isCreateMode, setIsCreateMode] = useState(initialSelectedScopeKey === "new");
    const [name, setName] = useState(initialSelectedScope?.name ?? "");
    const [displayName, setDisplayName] = useState(
        initialSelectedScope?.display_name ?? ""
    );
    const [baseline, setBaseline] = useState({
        name: initialSelectedScope?.name ?? "",
        displayName: initialSelectedScope?.display_name ?? ""
    });
    const [fieldError, setFieldError] = useState<{
        name?: string;
        displayName?: string;
    }>({});
    const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeletePending, setIsDeletePending] = useState(false);
    const [isEditorFlashActive, setIsEditorFlashActive] = useState(false);
    const editorFlashStartTimeoutRef = useRef<number | null>(null);
    const editorFlashHideTimeoutRef = useRef<number | null>(null);
    const editorFlashCancelAfterScrollRef = useRef<(() => void) | null>(null);
    const previousEditorFlashKeyRef = useRef<string | null>(null);
    const editorPanelElementRef = useRef<HTMLDivElement | null>(null);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    const initialSearchScopeKeyRef = useRef<ScopeSelectionKey>(initialSearchScopeKey);
    const selectedScopeKeyRef = useRef<ScopeSelectionKey>(initialSelectedScopeKey);
    const didResolveInitialUrlRef = useRef(false);

    useEffect(() => {
        setPortalTarget(document.getElementById("app-shell-footer-slot"));
    }, []);

    const selectedScope = useMemo(() => {
        if (isCreateMode) {
            return null;
        }

        return (
            directory.item_list.find((item) => item.id === selectedScopeId) ??
            directory.item_list[0] ??
            null
        );
    }, [directory.item_list, isCreateMode, selectedScopeId]);

    useEffect(() => {
        selectedScopeKeyRef.current = isCreateMode ? "new" : selectedScope?.id ?? null;
    }, [isCreateMode, selectedScope]);

    const syncFromDirectory = useCallback(
        (
            nextDirectory: TenantScopeDirectoryResponse,
            preferredKey?: ScopeSelectionKey,
            nextSuccessMessage: string | null = null
        ) => {
            const nextKey = resolveSelectedScopeKey(
                nextDirectory.item_list,
                preferredKey ?? null,
                nextDirectory.can_create
            );
            const nextSelectedScope =
                typeof nextKey === "number"
                    ? nextDirectory.item_list.find((item) => item.id === nextKey) ?? null
                    : null;

            setDirectory(nextDirectory);
            setIsCreateMode(nextKey === "new");
            setSelectedScopeId(typeof nextKey === "number" ? nextKey : null);
            setName(nextSelectedScope?.name ?? "");
            setDisplayName(nextSelectedScope?.display_name ?? "");
            setBaseline({
                name: nextSelectedScope?.name ?? "",
                displayName: nextSelectedScope?.display_name ?? ""
            });
            setFieldError({});
            setRequestErrorMessage(null);
            setIsDeletePending(false);
            setSuccessMessage(nextSuccessMessage);

            return nextKey;
        },
        []
    );

    useEffect(() => {
        const preferredKey = didResolveInitialUrlRef.current
            ? selectedScopeKeyRef.current
            : initialSearchScopeKeyRef.current;

        didResolveInitialUrlRef.current = true;
        syncFromDirectory(initialDirectory, preferredKey);
    }, [initialDirectory, syncFromDirectory]);

    useEffect(() => {
        const currentQuery = searchParams.toString();
        const currentPath = currentQuery ? `${scopePath}?${currentQuery}` : scopePath;
        const nextPath = buildScopePath(
            scopePath,
            isCreateMode ? "new" : selectedScope?.id ?? null
        );

        if (currentPath !== nextPath) {
            replacePath(nextPath);
        }
    }, [isCreateMode, replacePath, scopePath, searchParams, selectedScope]);

    const isDirty = useMemo(() => {
        return (
            name.trim() !== baseline.name.trim() ||
            displayName.trim() !== baseline.displayName.trim() ||
            isDeletePending
        );
    }, [baseline.displayName, baseline.name, displayName, isDeletePending, name]);

    const validate = useCallback(() => {
        const nextError: { name?: string; displayName?: string } = {};

        if (!name.trim()) {
            nextError.name = copy.validationError;
        }

        if (!displayName.trim()) {
            nextError.displayName = copy.validationError;
        }

        setFieldError(nextError);
        return Object.keys(nextError).length === 0;
    }, [copy.validationError, displayName, name]);

    const triggerEditorFlash = useCallback(() => {
        if (editorFlashStartTimeoutRef.current != null) {
            window.clearTimeout(editorFlashStartTimeoutRef.current);
            editorFlashStartTimeoutRef.current = null;
        }
        if (editorFlashHideTimeoutRef.current != null) {
            window.clearTimeout(editorFlashHideTimeoutRef.current);
            editorFlashHideTimeoutRef.current = null;
        }
        editorFlashCancelAfterScrollRef.current?.();
        editorFlashCancelAfterScrollRef.current = null;

        setIsEditorFlashActive(false);
        editorFlashStartTimeoutRef.current = window.setTimeout(() => {
            editorFlashStartTimeoutRef.current = null;

            const panel = editorPanelElementRef.current;
            if (!panel) {
                return;
            }

            let aborted = false;
            let flashStarted = false;
            const FLASH_MS = 960;
            const SCROLL_END_FALLBACK_MS = 900;
            const scrollEndSupported =
                typeof Document !== "undefined" && "onscrollend" in Document.prototype;

            let fallbackTimeoutId = 0;

            const cleanupWait = () => {
                window.clearTimeout(fallbackTimeoutId);
                document.removeEventListener("scrollend", onScrollEnd);
                editorFlashCancelAfterScrollRef.current = null;
            };

            const startFlash = () => {
                if (aborted || flashStarted) {
                    return;
                }
                flashStarted = true;
                cleanupWait();
                setIsEditorFlashActive(true);
                editorFlashHideTimeoutRef.current = window.setTimeout(() => {
                    setIsEditorFlashActive(false);
                    editorFlashHideTimeoutRef.current = null;
                }, FLASH_MS);
            };

            const onScrollEnd = () => {
                startFlash();
            };

            if (isEditorPanelTopVisibleInScrollport(panel)) {
                startFlash();
                return;
            }

            panel.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest"
            });

            if (scrollEndSupported) {
                document.addEventListener("scrollend", onScrollEnd, { passive: true });
            }
            const fallbackMs = scrollEndSupported ? SCROLL_END_FALLBACK_MS : 480;
            fallbackTimeoutId = window.setTimeout(startFlash, fallbackMs);

            editorFlashCancelAfterScrollRef.current = () => {
                aborted = true;
                cleanupWait();
            };
        }, 24);
    }, []);

    const editorFlashKey = useMemo(() => {
        if (isCreateMode) {
            return "new";
        }

        if (!selectedScope) {
            return null;
        }

        return `id:${String(selectedScope.id)}:name:${selectedScope.name}:display:${selectedScope.display_name}`;
    }, [isCreateMode, selectedScope]);

    useEffect(() => {
        if (!editorFlashKey) {
            previousEditorFlashKeyRef.current = null;
            return;
        }

        if (previousEditorFlashKeyRef.current === null) {
            previousEditorFlashKeyRef.current = editorFlashKey;
            return;
        }

        if (previousEditorFlashKeyRef.current === editorFlashKey) {
            return;
        }

        previousEditorFlashKeyRef.current = editorFlashKey;
        triggerEditorFlash();
    }, [editorFlashKey, triggerEditorFlash]);

    useEffect(() => {
        return () => {
            if (editorFlashStartTimeoutRef.current != null) {
                window.clearTimeout(editorFlashStartTimeoutRef.current);
            }
            if (editorFlashHideTimeoutRef.current != null) {
                window.clearTimeout(editorFlashHideTimeoutRef.current);
            }
            editorFlashCancelAfterScrollRef.current?.();
            editorFlashCancelAfterScrollRef.current = null;
        };
    }, []);

    const handleStartCreate = useCallback(() => {
        if (!directory.can_create || isSaving) {
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

    const handleSelectScope = useCallback(
        (scope: TenantScopeRecord) => {
            if (!isCreateMode && scope.id === selectedScope?.id) {
                return;
            }

            if (isDirty && !window.confirm(copy.discardConfirm)) {
                return;
            }

            syncFromDirectory(directory, scope.id);
        },
        [copy.discardConfirm, directory, isCreateMode, isDirty, selectedScope, syncFromDirectory]
    );

    const handleBack = useCallback(
        (event: MouseEvent<HTMLAnchorElement>) => {
            if (isDirty && !window.confirm(copy.discardConfirm)) {
                event.preventDefault();
            }
        },
        [copy.discardConfirm, isDirty]
    );

    const handleToggleDelete = useCallback(() => {
        if (!selectedScope?.can_delete || isSaving) {
            return;
        }

        setRequestErrorMessage(null);
        setSuccessMessage(null);
        setIsDeletePending((previous) => !previous);
    }, [isSaving, selectedScope]);

    const handleSave = useCallback(async () => {
        setRequestErrorMessage(null);
        setSuccessMessage(null);

        if (!isDeletePending && !validate()) {
            return;
        }

        setIsSaving(true);
        try {
            if (isCreateMode) {
                const previousScopeIdSet = new Set(directory.item_list.map((item) => item.id));
                const response = await fetch("/api/auth/tenant/current/scopes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: name.trim(),
                        display_name: displayName.trim()
                    })
                });
                const data: unknown = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setRequestErrorMessage(parseErrorDetail(data, copy.createError));
                    return;
                }

                const updatedDirectory = data as TenantScopeDirectoryResponse;
                const createdScopeId =
                    updatedDirectory.item_list.find((item) => !previousScopeIdSet.has(item.id))?.id ??
                    updatedDirectory.item_list.find(
                        (item) =>
                            item.name === name.trim() && item.display_name === displayName.trim()
                    )?.id ??
                    updatedDirectory.item_list[0]?.id ??
                    null;

                syncFromDirectory(updatedDirectory, createdScopeId, copy.createdNotice);
                return;
            }

            if (!selectedScope) {
                return;
            }

            const response = await fetch(
                `/api/auth/tenant/current/scopes/${selectedScope.id}`,
                isDeletePending
                    ? {
                        method: "DELETE"
                    }
                    : {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: name.trim(),
                            display_name: displayName.trim()
                        })
                    }
            );
            const data: unknown = await response.json().catch(() => ({}));

            if (!response.ok) {
                setRequestErrorMessage(
                    parseErrorDetail(data, isDeletePending ? copy.deleteError : copy.saveError)
                );
                return;
            }

            const updatedDirectory = data as TenantScopeDirectoryResponse;
            const nextSelection =
                isDeletePending && updatedDirectory.item_list.length === 0
                    ? updatedDirectory.can_create
                        ? "new"
                        : null
                    : selectedScope.id;
            syncFromDirectory(
                updatedDirectory,
                nextSelection,
                isDeletePending ? copy.deletedNotice : copy.savedNotice
            );
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
        copy.createdNotice,
        copy.deleteError,
        copy.deletedNotice,
        copy.saveError,
        copy.savedNotice,
        directory.item_list,
        displayName,
        isCreateMode,
        isDeletePending,
        name,
        selectedScope,
        syncFromDirectory,
        validate
    ]);

    const selectedScopeKey: ScopeSelectionKey = isCreateMode ? "new" : selectedScope?.id ?? null;
    const canEditForm = isCreateMode
        ? directory.can_create
        : selectedScope?.can_edit ?? false;
    const canSubmit = isCreateMode
        ? directory.can_create
        : isDeletePending
            ? selectedScope?.can_delete ?? false
            : selectedScope?.can_edit ?? false;
    const footerErrorMessage =
        requestErrorMessage ?? fieldError.name ?? fieldError.displayName ?? null;

    return (
        <section className="ui-page-stack ui-page-stack-footer">
            <PageHeader title={copy.title} description={copy.description} />

            <div className="ui-layout-directory ui-layout-directory-editor">
                <aside className="ui-panel ui-stack-lg ui-panel-context-card">
                    {!directory.can_edit ? (
                        <div className="ui-notice-attention ui-notice-block">
                            {copy.readOnlyNotice}
                        </div>
                    ) : null}

                    <div className="ui-directory-list">
                        {directory.can_create ? (
                            <div className="ui-location-nest-list-toolbar">
                                <button
                                    type="button"
                                    className="ui-location-nest-create"
                                    style={buildScopeListCreateToneStyle()}
                                    aria-label={copy.newScope}
                                    title={copy.newScope}
                                    data-active={isCreateMode ? "true" : undefined}
                                    onClick={handleStartCreate}
                                    disabled={isSaving}
                                >
                                    <span aria-hidden>{copy.newScope}</span>
                                </button>
                            </div>
                        ) : null}

                        {directory.item_list.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectScope(item)}
                                className="ui-directory-item"
                                data-selected={item.id === selectedScope?.id ? "true" : undefined}
                                data-delete-pending={
                                    item.id === selectedScope?.id && isDeletePending ? "true" : undefined
                                }
                            >
                                <p className="ui-directory-title">
                                    {resolveScopeLabel(item)}
                                </p>
                                <p className="ui-directory-caption-wrap">
                                    {item.display_name}
                                </p>
                                <div className="ui-directory-meta">
                                    <span className="ui-badge ui-badge-neutral">
                                        #{item.id}
                                    </span>
                                </div>
                            </button>
                        ))}

                        {directory.item_list.length === 0 && !directory.can_create ? (
                            <div className="ui-panel ui-empty-panel ui-panel-body-compact">
                                {copy.empty}
                            </div>
                        ) : null}
                    </div>
                </aside>

                <div
                    ref={editorPanelElementRef}
                    className="ui-panel ui-panel-editor ui-editor-panel"
                    data-delete-pending={isDeletePending ? "true" : undefined}
                >
                    <div className="ui-editor-panel-body">
                        {successMessage ? (
                            <div className="ui-status-panel ui-tone-positive ui-status-copy">
                                {successMessage}
                            </div>
                        ) : null}

                        {selectedScopeKey ? (
                            <div className="ui-editor-card-flow">
                                <section className="ui-card ui-form-section ui-border-accent">
                                    {isEditorFlashActive ? (
                                        <>
                                            <span
                                                aria-hidden
                                                className="ui-editor-flash-ring"
                                            />
                                            <span
                                                aria-hidden
                                                className="ui-editor-flash-fill"
                                            />
                                        </>
                                    ) : null}

                                    <div className="ui-editor-content">
                                        <div className="ui-field">
                                            <label className="ui-field-label" htmlFor="scope-name">
                                                {copy.nameLabel}
                                            </label>
                                            <input
                                                id="scope-name"
                                                className="ui-input"
                                                value={name}
                                                onChange={(event) => {
                                                    setName(event.target.value);
                                                    setFieldError((previous) => ({
                                                        ...previous,
                                                        name: undefined
                                                    }));
                                                    setSuccessMessage(null);
                                                }}
                                                disabled={isDeletePending || !canEditForm}
                                                aria-invalid={Boolean(fieldError.name)}
                                            />
                                            <p className="ui-field-hint">{copy.nameHint}</p>
                                            {fieldError.name ? (
                                                <p className="ui-field-error">{fieldError.name}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                </section>

                                <section className="ui-card ui-form-section ui-border-accent">
                                    <div className="ui-editor-content">
                                        <div className="ui-field">
                                            <label
                                                className="ui-field-label"
                                                htmlFor="scope-display-name"
                                            >
                                                {copy.displayNameLabel}
                                            </label>
                                            <textarea
                                                id="scope-display-name"
                                                className="ui-input ui-input-textarea"
                                                value={displayName}
                                                onChange={(event) => {
                                                    setDisplayName(event.target.value);
                                                    setFieldError((previous) => ({
                                                        ...previous,
                                                        displayName: undefined
                                                    }));
                                                    setSuccessMessage(null);
                                                }}
                                                disabled={isDeletePending || !canEditForm}
                                                aria-invalid={Boolean(fieldError.displayName)}
                                            />
                                            <p className="ui-field-hint">{copy.displayNameHint}</p>
                                            {fieldError.displayName ? (
                                                <p className="ui-field-error">
                                                    {fieldError.displayName}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </section>

                                {!isCreateMode && selectedScope ? (
                                    <section className="ui-card ui-form-section ui-border-accent">
                                        <div className="ui-editor-content">
                                            <div className="ui-section-header">
                                                <span className="ui-icon-badge">
                                                    <InfoIcon className="ui-icon" />
                                                </span>
                                                <div className="ui-section-copy">
                                                    <h2 className="ui-header-title ui-title-section">
                                                        {copy.sectionInfoTitle}
                                                    </h2>
                                                    <p className="ui-copy-body">
                                                        {copy.sectionInfoDescription}
                                                    </p>
                                                </div>
                                            </div>

                                            <ul className="ui-info-topic-list">
                                                <li>
                                                    <p className="ui-info-topic-lead">
                                                        <span className="ui-info-topic-label">
                                                            {copy.infoIdLabel}
                                                        </span>
                                                        {": "}
                                                        <span className="ui-info-topic-value">
                                                            {selectedScope.id}
                                                        </span>
                                                    </p>
                                                </li>
                                                <li>
                                                    <p className="ui-info-topic-lead">
                                                        <span className="ui-info-topic-label">
                                                            {copy.infoNameRegisteredLabel}
                                                        </span>
                                                        {": "}
                                                        <span className="ui-info-topic-value">
                                                            {selectedScope.name.trim() || "—"}
                                                        </span>
                                                    </p>
                                                </li>
                                                <li>
                                                    <p className="ui-info-topic-lead">
                                                        <span className="ui-info-topic-label">
                                                            {copy.infoDisplayRegisteredLabel}
                                                        </span>
                                                        {": "}
                                                        <span className="ui-info-topic-value">
                                                            {selectedScope.display_name.trim() || "—"}
                                                        </span>
                                                    </p>
                                                </li>
                                                <li>
                                                    <p className="ui-info-topic-lead">
                                                        <span className="ui-info-topic-label">
                                                            {copy.infoCanEditLabel}
                                                        </span>
                                                        {": "}
                                                        <span className="ui-info-topic-value">
                                                            {selectedScope.can_edit ? copy.infoYes : copy.infoNo}
                                                        </span>
                                                    </p>
                                                </li>
                                                <li>
                                                    <p className="ui-info-topic-lead">
                                                        <span className="ui-info-topic-label">
                                                            {copy.infoCanDeleteLabel}
                                                        </span>
                                                        {": "}
                                                        <span className="ui-info-topic-value">
                                                            {selectedScope.can_delete ? copy.infoYes : copy.infoNo}
                                                        </span>
                                                    </p>
                                                </li>
                                            </ul>
                                        </div>
                                    </section>
                                ) : null}

                                {isCreateMode ? (
                                    <section className="ui-card ui-form-section ui-border-accent">
                                        <div className="ui-editor-content">
                                            <div className="ui-section-header">
                                                <span className="ui-icon-badge">
                                                    <InfoIcon className="ui-icon" />
                                                </span>
                                                <div className="ui-section-copy">
                                                    <h2 className="ui-header-title ui-title-section">
                                                        {copy.sectionInfoTitle}
                                                    </h2>
                                                    <p className="ui-copy-body">
                                                        {copy.sectionInfoDescription}
                                                    </p>
                                                </div>
                                            </div>

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
                                        </div>
                                    </section>
                                ) : null}
                            </div>
                        ) : (
                            <div className="ui-panel ui-empty-panel">
                                {copy.selectPrompt}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <section
                className="ui-card ui-card-coming-soon ui-panel-body-compact"
                aria-labelledby="scope-history-heading"
            >
                <div className="ui-section-header">
                    <span className="ui-icon-badge ui-icon-badge-construction">
                        <HistoryIcon className="ui-icon" />
                    </span>
                    <div className="ui-section-copy">
                        <h2
                            id="scope-history-heading"
                            className="ui-header-title ui-title-section"
                        >
                            {copy.historyTitle}
                        </h2>
                        <p className="ui-copy-body">{copy.historyDescription}</p>
                    </div>
                </div>
            </section>

            {portalTarget
                ? createPortal(
                    <div className="ui-action-footer">
                        <Link
                            href={configurationPath}
                            className="ui-button-secondary"
                            onClick={handleBack}
                        >
                            {copy.cancel}
                        </Link>
                        <div className="ui-action-footer-feedback">
                            {footerErrorMessage ? (
                                <div className="ui-notice-danger ui-notice-block ui-status-copy">
                                    {footerErrorMessage}
                                </div>
                            ) : null}
                        </div>
                        <div className="ui-action-footer-end">
                            {!isCreateMode && selectedScope ? (
                                <button
                                    type="button"
                                    className="ui-button-danger"
                                    onClick={handleToggleDelete}
                                    disabled={!selectedScope.can_delete || isSaving}
                                >
                                    {isDeletePending ? copy.undoDelete : copy.delete}
                                </button>
                            ) : null}
                            <button
                                type="button"
                                className="ui-button-primary"
                                onClick={() => void handleSave()}
                                disabled={!selectedScopeKey || !canSubmit || isSaving || !isDirty}
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
