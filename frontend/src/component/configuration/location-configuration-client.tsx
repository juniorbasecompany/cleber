"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { DragEvent, MouseEvent } from "react";
import { createPortal } from "react-dom";

import { PageHeader } from "@/component/app-shell/page-header";
import { StatusPanel } from "@/component/app-shell/status-panel";
import {
  HistoryIcon,
  PreviewIcon,
  WorkflowIcon
} from "@/component/ui/ui-icons";
import type {
  TenantLocationDirectoryResponse,
  TenantLocationRecord,
  TenantScopeDirectoryResponse
} from "@/lib/auth/types";

type Props = {
  locale: string;
  initialScopeDirectory: TenantScopeDirectoryResponse;
  initialLocationDirectory: TenantLocationDirectoryResponse | null;
  copy: Record<string, string>;
};

type TabKey = "general" | "history";
type SelectedLocationKey = number | "new" | null;

function normalizeTab(raw: string | null): TabKey {
  return raw === "history" ? "history" : "general";
}

function parseScopeId(raw: string | null): number | null {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseLocationKey(raw: string | null): SelectedLocationKey {
  if (raw === "new") {
    return "new";
  }

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildPath(
  basePath: string,
  tab: TabKey,
  scopeId: number | null,
  locationKey: SelectedLocationKey
) {
  const params = new URLSearchParams();
  if (tab === "history") {
    params.set("tab", "history");
  }
  if (scopeId != null) {
    params.set("scope", String(scopeId));
  }
  if (locationKey === "new") {
    params.set("location", "new");
  } else if (typeof locationKey === "number") {
    params.set("location", String(locationKey));
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function parseErrorDetail(payload: unknown, fallback: string) {
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

function resolveLocationLabel(item: TenantLocationRecord) {
  return item.name.trim() || item.display_name.trim() || `#${item.id}`;
}

type InlineIconProps = {
  className?: string;
};

function iconClassName(className?: string) {
  return ["h-[1.2rem] w-[1.2rem]", className].filter(Boolean).join(" ");
}

function GripDotsIcon({ className }: InlineIconProps) {
  return (
    <svg className={iconClassName(className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="6.5" r="1.35" />
      <circle cx="15" cy="6.5" r="1.35" />
      <circle cx="9" cy="12" r="1.35" />
      <circle cx="15" cy="12" r="1.35" />
      <circle cx="9" cy="17.5" r="1.35" />
      <circle cx="15" cy="17.5" r="1.35" />
    </svg>
  );
}

function MoveUpIcon({ className }: InlineIconProps) {
  return (
    <svg
      className={iconClassName(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 18V6.5" />
      <path d="m7.5 11 4.5-4.5 4.5 4.5" />
    </svg>
  );
}

function MoveDownIcon({ className }: InlineIconProps) {
  return (
    <svg
      className={iconClassName(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 6v11.5" />
      <path d="m7.5 13 4.5 4.5 4.5-4.5" />
    </svg>
  );
}

function NewChildIcon({ className }: InlineIconProps) {
  return (
    <svg
      className={iconClassName(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15.5 5h4" />
      <path d="M17.5 3v4" />
      <path d="M8 7.5v7.5" strokeDasharray="1.8 2.4" />
      <path d="M8 15h10.5" />
      <path d="m14.5 11 4 4-4 4" />
    </svg>
  );
}

function NewSiblingIcon({ className }: InlineIconProps) {
  return (
    <svg
      className={iconClassName(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15.5 5h4" />
      <path d="M17.5 3v4" />
      <path d="M12 8.5v9.5" strokeDasharray="1.8 2.4" />
      <path d="m7.5 13.5 4.5 4.5 4.5-4.5" />
    </svg>
  );
}

export function LocationConfigurationClient({
  locale,
  initialScopeDirectory,
  initialLocationDirectory,
  copy
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = normalizeTab(searchParams.get("tab"));
  const initialScopeId =
    initialScopeDirectory.item_list.find(
      (item) => item.id === parseScopeId(searchParams.get("scope"))
    )?.id ??
    initialScopeDirectory.item_list[0]?.id ??
    null;
  const initialLocationKey =
    initialLocationDirectory && initialLocationDirectory.scope_id === initialScopeId
      ? parseLocationKey(searchParams.get("location"))
      : null;

  const locationPath = `/${locale}/app/configuration/location`;
  const configurationPath = `/${locale}/app/configuration`;

  const replacePath = useCallback(
    (nextPath: string) => {
      router.replace(nextPath, { scroll: false });
    },
    [router]
  );

  const [scopeId, setScopeId] = useState<number | null>(initialScopeId);
  const [directory, setDirectory] = useState<TenantLocationDirectoryResponse | null>(
    initialLocationDirectory
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    typeof initialLocationKey === "number" ? initialLocationKey : null
  );
  const [isCreateMode, setIsCreateMode] = useState(initialLocationKey === "new");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [parentLocationId, setParentLocationId] = useState<number | null>(null);
  const [baseline, setBaseline] = useState({
    name: "",
    displayName: "",
    parentLocationId: null as number | null
  });
  const [fieldError, setFieldError] = useState<{
    name?: string;
    displayName?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [expandedIdSet, setExpandedIdSet] = useState<Set<number>>(new Set());
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [draggedLocationId, setDraggedLocationId] = useState<number | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [editorScrollToken, setEditorScrollToken] = useState(0);
  const [isEditorFlashActive, setIsEditorFlashActive] = useState(false);
  const didInitRef = useRef(false);
  const editorPanelRef = useRef<HTMLDivElement | null>(null);
  const editorFlashStartTimeoutRef = useRef<number | null>(null);
  const editorFlashHideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-shell-footer-slot"));
  }, []);

  const itemList = directory?.item_list ?? [];
  const itemMap = useMemo(() => new Map(itemList.map((item) => [item.id, item])), [itemList]);
  const childrenByParent = useMemo(() => {
    const next = new Map<number | null, TenantLocationRecord[]>();
    for (const item of itemList) {
      const parentId = item.parent_location_id ?? null;
      const current = next.get(parentId) ?? [];
      current.push(item);
      next.set(parentId, current);
    }
    return next;
  }, [itemList]);

  const selectedLocation = useMemo(() => {
    if (isCreateMode) {
      return null;
    }
    return itemList.find((item) => item.id === selectedLocationId) ?? itemList[0] ?? null;
  }, [isCreateMode, itemList, selectedLocationId]);

  const selectedLocationKey: SelectedLocationKey = isCreateMode
    ? "new"
    : (selectedLocation?.id ?? null);

  useEffect(() => {
    const currentPath = buildPath(
      locationPath,
      tab,
      parseScopeId(searchParams.get("scope")),
      parseLocationKey(searchParams.get("location"))
    );
    const nextPath = buildPath(locationPath, tab, scopeId, selectedLocationKey);
    if (currentPath !== nextPath) {
      replacePath(nextPath);
    }
  }, [locationPath, replacePath, scopeId, searchParams, selectedLocationKey, tab]);

  useEffect(() => {
    if (!directory) {
      return;
    }
    setExpandedIdSet(
      new Set(
        directory.item_list
          .filter((item) => item.children_count > 0)
          .map((item) => item.id)
      )
    );
  }, [directory]);

  const syncEditor = useCallback(
    (
      location: TenantLocationRecord | null,
      createMode: boolean,
      draftParentId: number | null
    ) => {
      setIsCreateMode(createMode);
      setSelectedLocationId(location?.id ?? null);
      setName(createMode ? "" : (location?.name ?? ""));
      setDisplayName(createMode ? "" : (location?.display_name ?? ""));
      setParentLocationId(
        createMode ? draftParentId : (location?.parent_location_id ?? null)
      );
      setBaseline({
        name: createMode ? "" : (location?.name ?? ""),
        displayName: createMode ? "" : (location?.display_name ?? ""),
        parentLocationId: createMode
          ? draftParentId
          : (location?.parent_location_id ?? null)
      });
      setFieldError({});
      setFormError(null);
      setSuccessMessage(null);
      setIsDeletePending(false);
    },
    []
  );

  useEffect(() => {
    if (didInitRef.current || !directory) {
      return;
    }
    didInitRef.current = true;
    if (initialLocationKey === "new") {
      syncEditor(null, true, null);
      return;
    }
    const nextSelected =
      typeof initialLocationKey === "number"
        ? itemList.find((item) => item.id === initialLocationKey) ?? itemList[0] ?? null
        : itemList[0] ?? null;
    syncEditor(nextSelected, false, null);
  }, [directory, initialLocationKey, itemList, syncEditor]);

  const loadDirectory = useCallback(
    async (nextScopeId: number, preferredLocationId: SelectedLocationKey = null) => {
      const response = await fetch(`/api/auth/tenant/current/scopes/${nextScopeId}/locations`);
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(parseErrorDetail(data, copy.loadError));
        return;
      }
      const nextDirectory = data as TenantLocationDirectoryResponse;
      setDirectory(nextDirectory);
      if (preferredLocationId === "new") {
        syncEditor(null, true, null);
        return;
      }
      const nextSelected =
        typeof preferredLocationId === "number"
          ? nextDirectory.item_list.find((item) => item.id === preferredLocationId) ??
            nextDirectory.item_list[0] ??
            null
          : nextDirectory.item_list[0] ?? null;
      syncEditor(nextSelected, false, null);
    },
    [copy.loadError, syncEditor]
  );

  const deferredTreeSearch = useDeferredValue(treeSearch);
  const visibleItemList = useMemo(() => {
    const query = deferredTreeSearch.trim().toLowerCase();
    const includeIdSet = new Set<number>();
    const result: TenantLocationRecord[] = [];

    if (query) {
      for (const item of itemList) {
        const haystack =
          `${item.name} ${item.display_name} ${item.path_labels.join(" / ")}`.toLowerCase();
        if (!haystack.includes(query)) {
          continue;
        }
        includeIdSet.add(item.id);
        let parentId = item.parent_location_id ?? null;
        while (parentId != null) {
          includeIdSet.add(parentId);
          parentId = itemMap.get(parentId)?.parent_location_id ?? null;
        }
      }
    }

    const visit = (parentId: number | null) => {
      for (const item of childrenByParent.get(parentId) ?? []) {
        if (query && !includeIdSet.has(item.id)) {
          continue;
        }
        result.push(item);
        if ((query || expandedIdSet.has(item.id)) && item.children_count > 0) {
          visit(item.id);
        }
      }
    };

    visit(null);
    return result;
  }, [childrenByParent, deferredTreeSearch, expandedIdSet, itemList, itemMap]);

  const isDirty =
    name.trim() !== baseline.name.trim() ||
    displayName.trim() !== baseline.displayName.trim() ||
    parentLocationId !== baseline.parentLocationId ||
    isDeletePending;

  const canEditForm = isCreateMode
    ? (directory?.can_create ?? false)
    : (selectedLocation?.can_edit ?? false);
  const canSubmit = isCreateMode
    ? (directory?.can_create ?? false)
    : isDeletePending
      ? (selectedLocation?.can_delete ?? false)
      : (selectedLocation?.can_edit ?? false);

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

  const moveLocation = useCallback(
    async (locationId: number, nextParentId: number | null, targetIndex: number) => {
      if (scopeId == null) {
        return;
      }
      setFormError(null);
      setSuccessMessage(null);
      setIsMoving(true);
      const response = await fetch(
        `/api/auth/tenant/current/scopes/${scopeId}/locations/${locationId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parent_location_id: nextParentId,
            target_index: targetIndex
          })
        }
      );
      const data: unknown = await response.json().catch(() => ({}));
      setIsMoving(false);
      setDraggedLocationId(null);
      setDropKey(null);
      if (!response.ok) {
        setFormError(parseErrorDetail(data, copy.moveError));
        return;
      }
      const nextDirectory = data as TenantLocationDirectoryResponse;
      setDirectory(nextDirectory);
      const nextSelected =
        nextDirectory.item_list.find((item) => item.id === locationId) ?? null;
      syncEditor(nextSelected, false, null);
      setSuccessMessage(copy.movedNotice);
    },
    [copy.moveError, copy.movedNotice, scopeId, syncEditor]
  );

  const scrollEditorIntoView = useCallback(() => {
    setEditorScrollToken((previous) => previous + 1);
  }, []);

  const triggerEditorFlash = useCallback(() => {
    if (editorFlashStartTimeoutRef.current != null) {
      window.clearTimeout(editorFlashStartTimeoutRef.current);
      editorFlashStartTimeoutRef.current = null;
    }
    if (editorFlashHideTimeoutRef.current != null) {
      window.clearTimeout(editorFlashHideTimeoutRef.current);
      editorFlashHideTimeoutRef.current = null;
    }

    setIsEditorFlashActive(false);
    editorFlashStartTimeoutRef.current = window.setTimeout(() => {
      setIsEditorFlashActive(true);
      editorFlashStartTimeoutRef.current = null;
      editorFlashHideTimeoutRef.current = window.setTimeout(() => {
        setIsEditorFlashActive(false);
        editorFlashHideTimeoutRef.current = null;
      }, 960);
    }, 24);
  }, []);

  const scheduleEditorFlashAfterScroll = useCallback(
    (startTop: number, targetTop: number) => {
      if (editorFlashStartTimeoutRef.current != null) {
        window.clearTimeout(editorFlashStartTimeoutRef.current);
        editorFlashStartTimeoutRef.current = null;
      }

      const distance = Math.abs(targetTop - startTop);
      const delay = Math.max(260, Math.min(720, 180 + distance * 0.42));
      editorFlashStartTimeoutRef.current = window.setTimeout(() => {
        editorFlashStartTimeoutRef.current = null;
        triggerEditorFlash();
      }, delay);
    },
    [triggerEditorFlash]
  );

  useEffect(() => {
    if (editorScrollToken === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const editorPanel = editorPanelRef.current;
      if (!editorPanel) {
        return;
      }

      const scrollContainer = editorPanel.closest(".ui-scroll-stable");
      const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
      const mobileOffset = isMobileViewport
        ? window.matchMedia("(min-width: 640px)").matches
          ? 112
          : 96
        : 0;

      if (scrollContainer instanceof HTMLElement) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const panelRect = editorPanel.getBoundingClientRect();
        const startTop = scrollContainer.scrollTop;
        const targetTop =
          startTop + (panelRect.top - containerRect.top - mobileOffset);

        editorPanel.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
        scheduleEditorFlashAfterScroll(startTop, Math.max(0, targetTop));
        return;
      }

      const startTop = window.scrollY;
      const targetTop = startTop + editorPanel.getBoundingClientRect().top - mobileOffset;
      editorPanel.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      });
      scheduleEditorFlashAfterScroll(startTop, Math.max(0, targetTop));
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [editorScrollToken, scheduleEditorFlashAfterScroll]);

  useEffect(() => {
    return () => {
      if (editorFlashStartTimeoutRef.current != null) {
        window.clearTimeout(editorFlashStartTimeoutRef.current);
      }
      if (editorFlashHideTimeoutRef.current != null) {
        window.clearTimeout(editorFlashHideTimeoutRef.current);
      }
    };
  }, []);

  const handleStartCreate = useCallback(
    (draftParentId: number | null, shouldScroll = false) => {
      if (!(directory?.can_create ?? false)) {
        return;
      }
      if (isDirty && !window.confirm(copy.discardConfirm)) {
        return;
      }
      syncEditor(null, true, draftParentId);
      if (shouldScroll) {
        scrollEditorIntoView();
      }
    },
    [
      copy.discardConfirm,
      directory?.can_create,
      isDirty,
      scrollEditorIntoView,
      syncEditor
    ]
  );

  const handleSelectLocation = useCallback(
    (location: TenantLocationRecord) => {
      if (!isCreateMode && location.id === selectedLocation?.id) {
        return;
      }
      if (isDirty && !window.confirm(copy.discardConfirm)) {
        return;
      }
      syncEditor(location, false, null);
      scrollEditorIntoView();
    },
    [
      copy.discardConfirm,
      isCreateMode,
      isDirty,
      scrollEditorIntoView,
      selectedLocation?.id,
      syncEditor
    ]
  );

  const handleSave = useCallback(async () => {
    if (!directory || scopeId == null) {
      return;
    }
    setFormError(null);
    setSuccessMessage(null);
    if (!isDeletePending && !validate()) {
      return;
    }

    setIsSaving(true);
    const endpoint = isCreateMode
      ? `/api/auth/tenant/current/scopes/${scopeId}/locations`
      : `/api/auth/tenant/current/scopes/${scopeId}/locations/${selectedLocation?.id}`;
    const previousLocationIdSet = new Set(directory.item_list.map((item) => item.id));
    const response = await fetch(
      endpoint,
      isDeletePending
        ? { method: "DELETE" }
        : {
            method: isCreateMode ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              display_name: displayName.trim(),
              parent_location_id: parentLocationId
            })
          }
    );
    const data: unknown = await response.json().catch(() => ({}));
    setIsSaving(false);

    if (!response.ok) {
      setFormError(
        parseErrorDetail(
          data,
          isDeletePending ? copy.deleteError : isCreateMode ? copy.createError : copy.saveError
        )
      );
      return;
    }

    const nextDirectory = data as TenantLocationDirectoryResponse;
    setDirectory(nextDirectory);

    if (isDeletePending) {
      syncEditor(
        nextDirectory.item_list[0] ?? null,
        nextDirectory.item_list.length === 0 && nextDirectory.can_create,
        null
      );
      setSuccessMessage(copy.deletedNotice);
      return;
    }

    if (isCreateMode) {
      const created =
        nextDirectory.item_list.find((item) => !previousLocationIdSet.has(item.id)) ??
        nextDirectory.item_list[0] ??
        null;
      syncEditor(created, false, null);
      setSuccessMessage(copy.createdNotice);
      return;
    }

    const updated =
      nextDirectory.item_list.find((item) => item.id === selectedLocation?.id) ?? null;
    syncEditor(updated, false, null);
    setSuccessMessage(copy.savedNotice);
  }, [
    copy.createError,
    copy.createdNotice,
    copy.deleteError,
    copy.deletedNotice,
    copy.saveError,
    copy.savedNotice,
    directory,
    displayName,
    isCreateMode,
    isDeletePending,
    name,
    parentLocationId,
    scopeId,
    selectedLocation?.id,
    syncEditor,
    validate
  ]);

  const pageTitle = isCreateMode
    ? copy.newLocationTitle
    : selectedLocation?.name ?? copy.title;

  return (
    <section className={`flex flex-col gap-6 ${tab === "general" ? "pb-56 lg:pb-0" : ""}`}>
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

      <div className="ui-panel flex flex-wrap gap-1 p-1.5" role="tablist" aria-label={copy.tabListAriaLabel}>
        <button type="button" className={`ui-tab px-4 py-2.5 text-sm font-semibold ${tab === "general" ? "ui-tab-active" : ""}`} onClick={() => replacePath(buildPath(locationPath, "general", scopeId, selectedLocationKey))}>{copy.tabGeneral}</button>
        <button type="button" className={`ui-tab px-4 py-2.5 text-sm font-semibold ${tab === "history" ? "ui-tab-active" : ""}`} onClick={() => replacePath(buildPath(locationPath, "history", scopeId, selectedLocationKey))}>{copy.tabHistory}</button>
      </div>

      {tab === "general" ? (
        <div className="grid gap-6 2xl:grid-cols-[minmax(18rem,0.84fr)_minmax(0,1.16fr)_minmax(18rem,0.84fr)]">
          <aside className="ui-panel flex flex-col gap-4 px-5 py-5">
            <div className="flex items-start gap-4">
              <span className="ui-icon-badge"><WorkflowIcon className="h-[1.05rem] w-[1.05rem]" /></span>
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">{copy.listTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">{copy.listDescription}</p>
              </div>
            </div>

            <div className="grid gap-2">
              {initialScopeDirectory.item_list.map((scope) => (
                <button key={scope.id} type="button" className={`rounded-[var(--radius-card)] border px-4 py-3 text-left ${scope.id === scopeId ? "border-[rgba(37,117,216,0.24)] bg-[var(--color-accent-soft)]/65" : "border-[var(--color-border)] bg-white/75"}`} onClick={() => { if (scope.id === scopeId) { return; } if (isDirty && !window.confirm(copy.discardConfirm)) { return; } setScopeId(scope.id); void loadDirectory(scope.id); }}>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{scope.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{scope.display_name}</p>
                </button>
              ))}
            </div>

            {scopeId == null ? <div className="ui-panel px-4 py-4 text-sm text-[var(--color-text-muted)]">{copy.emptyScope}</div> : null}
            {directory && !directory.can_edit ? <div className="ui-notice-attention px-4 py-3 text-sm">{copy.readOnlyNotice}</div> : null}

            <input className="ui-input w-full" value={treeSearch} onChange={(event) => setTreeSearch(event.target.value)} placeholder={copy.treeSearchPlaceholder} disabled={!directory} />

            <div className="grid gap-1">
              {visibleItemList.map((item) => {
                const siblings = childrenByParent.get(item.parent_location_id ?? null) ?? [];
                const siblingIndex = siblings.findIndex((sibling) => sibling.id === item.id);
                const topKey = `before-${item.id}`;
                const insideKey = `inside-${item.id}`;
                const bottomKey = `after-${item.id}`;
                const isSelected = item.id === selectedLocation?.id && !isCreateMode;

                return (
                  <div key={item.id} className="grid gap-1">
                    <div className={`h-2 rounded-full ${dropKey === topKey ? "bg-[var(--color-accent)]/70" : "bg-transparent"}`} onDragOver={(event) => { if (!draggedLocationId || draggedLocationId === item.id) { return; } event.preventDefault(); setDropKey(topKey); }} onDrop={(event) => { event.preventDefault(); if (!draggedLocationId || draggedLocationId === item.id) { return; } void moveLocation(draggedLocationId, item.parent_location_id ?? null, siblingIndex); }} />
                    <div className="flex items-stretch gap-2">
                      <button type="button" className="flex w-12 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-white/80 text-[var(--color-text-muted)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-background-muted)] disabled:cursor-not-allowed disabled:opacity-45" draggable={item.can_move && !isSaving && !isMoving} onDragStart={(event: DragEvent<HTMLButtonElement>) => { setDraggedLocationId(item.id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDraggedLocationId(null); setDropKey(null); }} disabled={!item.can_move || isSaving || isMoving} aria-label={copy.dragDropHint} title={copy.dragDropHint}>
                        <GripDotsIcon />
                      </button>
                      <div className={`flex flex-1 items-stretch gap-3 rounded-[var(--radius-card)] border px-4 py-3 ${dropKey === insideKey ? "border-[rgba(37,117,216,0.38)] bg-[var(--color-accent-soft)]/75" : isSelected ? "border-[rgba(37,117,216,0.24)] bg-[var(--color-accent-soft)]/65" : "border-[var(--color-border)] bg-white/75"}`} onDragOver={(event) => { if (!draggedLocationId || draggedLocationId === item.id) { return; } event.preventDefault(); setDropKey(insideKey); }} onDrop={(event) => { event.preventDefault(); if (!draggedLocationId || draggedLocationId === item.id) { return; } void moveLocation(draggedLocationId, item.id, item.children_count); }}>
                        {item.children_count > 0 ? (
                          <button type="button" className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[11px]" onClick={() => setExpandedIdSet((previous) => { const next = new Set(previous); if (next.has(item.id)) { next.delete(item.id); } else { next.add(item.id); } return next; })}>
                            {expandedIdSet.has(item.id) ? "-" : "+"}
                          </button>
                        ) : <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center text-[11px]">•</span>}
                        <button type="button" className="flex-1 text-left" onClick={() => handleSelectLocation(item)} style={{ paddingLeft: `${item.depth * 1.1}rem` }}>
                          <p className="text-sm font-semibold text-[var(--color-text)]">{resolveLocationLabel(item)}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{item.display_name}</p>
                        </button>
                      </div>
                      <div className="grid w-[7rem] shrink-0 grid-cols-2 gap-2">
                        <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-white/80 text-[var(--color-text-muted)] transition hover:border-[rgba(37,117,216,0.28)] hover:bg-[var(--color-accent-soft)]/45 hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-45" onClick={() => siblingIndex > 0 ? void moveLocation(item.id, item.parent_location_id ?? null, siblingIndex - 1) : undefined} disabled={!item.can_move || siblingIndex < 1 || isSaving || isMoving} aria-label={copy.moveUp} title={copy.moveUp}>
                          <MoveUpIcon />
                        </button>
                        <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-white/80 text-[var(--color-text-muted)] transition hover:border-[rgba(37,117,216,0.28)] hover:bg-[var(--color-accent-soft)]/45 hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-45" onClick={() => handleStartCreate(item.id, true)} disabled={!directory?.can_create || isSaving || isMoving} aria-label={copy.newChild} title={copy.newChild}>
                          <NewChildIcon />
                        </button>
                        <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-white/80 text-[var(--color-text-muted)] transition hover:border-[rgba(37,117,216,0.28)] hover:bg-[var(--color-accent-soft)]/45 hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-45" onClick={() => siblingIndex >= 0 ? void moveLocation(item.id, item.parent_location_id ?? null, siblingIndex + 1) : undefined} disabled={!item.can_move || siblingIndex < 0 || siblingIndex >= siblings.length - 1 || isSaving || isMoving} aria-label={copy.moveDown} title={copy.moveDown}>
                          <MoveDownIcon />
                        </button>
                        <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-white/80 text-[var(--color-text-muted)] transition hover:border-[rgba(37,117,216,0.28)] hover:bg-[var(--color-accent-soft)]/45 hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-45" onClick={() => handleStartCreate(item.parent_location_id ?? null, true)} disabled={!directory?.can_create || isSaving || isMoving} aria-label={copy.newSibling} title={copy.newSibling}>
                          <NewSiblingIcon />
                        </button>
                      </div>
                    </div>
                    <div className={`h-2 rounded-full ${dropKey === bottomKey ? "bg-[var(--color-accent)]/70" : "bg-transparent"}`} onDragOver={(event) => { if (!draggedLocationId || draggedLocationId === item.id) { return; } event.preventDefault(); setDropKey(bottomKey); }} onDrop={(event) => { event.preventDefault(); if (!draggedLocationId || draggedLocationId === item.id) { return; } void moveLocation(draggedLocationId, item.parent_location_id ?? null, siblingIndex + 1); }} />
                  </div>
                );
              })}

              {directory && visibleItemList.length === 0 ? <div className="ui-panel px-4 py-4 text-sm text-[var(--color-text-muted)]">{itemList.length === 0 ? copy.empty : copy.treeNoMatches}</div> : null}
            </div>

            <button type="button" className="ui-button-secondary mt-2" onClick={() => handleStartCreate(null, true)} disabled={!directory?.can_create}>{copy.newLabel}</button>
          </aside>
          <div
            ref={editorPanelRef}
            className={`ui-panel relative isolate flex flex-col gap-6 px-6 py-6 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-0 ${
              isDeletePending ? "ui-delete-pending" : ""
            }`}
          >
            <div className="flex flex-col gap-6">
              {successMessage ? <div className="ui-tone-positive rounded-[var(--radius-card)] border px-4 py-3 text-sm">{successMessage}</div> : null}
              {formError ? <div className="ui-notice-danger px-4 py-3 text-sm">{formError}</div> : null}

              <section className="ui-card relative isolate px-5 py-5">
                {isEditorFlashActive ? (
                  <>
                    <span
                      aria-hidden
                      className="location-editor-flash-ring pointer-events-none absolute inset-0 rounded-[inherit]"
                      style={{
                        border: "2px solid rgba(37, 117, 216, 0.46)",
                        boxShadow:
                          "0 0 0 6px rgba(37, 117, 216, 0.18), 0 22px 48px rgba(15, 23, 42, 0.12)"
                      }}
                    />
                    <span
                      aria-hidden
                      className="location-editor-flash-fill pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[inherit]"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(37, 117, 216, 0.18), rgba(37, 117, 216, 0.07) 45%, rgba(37, 117, 216, 0.01) 100%)"
                      }}
                    />
                  </>
                ) : null}

                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <span className="ui-icon-badge"><PreviewIcon className="h-[1.05rem] w-[1.05rem]" /></span>
                    <div>
                      <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">{copy.sectionIdentityTitle}</h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">{copy.sectionIdentityDescription}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--color-text-muted)]" htmlFor="location-name">{copy.nameLabel}</label>
                      <input id="location-name" className="ui-input w-full" value={name} onChange={(event) => { setName(event.target.value); setFieldError((previous) => ({ ...previous, name: undefined })); setSuccessMessage(null); }} disabled={isDeletePending || !canEditForm} aria-invalid={Boolean(fieldError.name)} />
                      <p className="text-xs leading-5 text-[var(--color-text-subtle)]">{copy.nameHint}</p>
                      {fieldError.name ? <p className="text-sm text-[var(--color-danger-text)]">{fieldError.name}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--color-text-muted)]" htmlFor="location-display-name">{copy.displayNameLabel}</label>
                      <textarea id="location-display-name" className="ui-input min-h-28 w-full resize-y" value={displayName} onChange={(event) => { setDisplayName(event.target.value); setFieldError((previous) => ({ ...previous, displayName: undefined })); setSuccessMessage(null); }} disabled={isDeletePending || !canEditForm} aria-invalid={Boolean(fieldError.displayName)} />
                      <p className="text-xs leading-5 text-[var(--color-text-subtle)]">{copy.displayNameHint}</p>
                      {fieldError.displayName ? <p className="text-sm text-[var(--color-danger-text)]">{fieldError.displayName}</p> : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>

          </div>

          <aside className="flex flex-col gap-4">
            {selectedLocation && !isCreateMode ? (
              <div className="ui-panel p-5">
                <div className="grid gap-3">
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/75 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">{copy.metadataIdLabel}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{selectedLocation.id}</p>
                  </div>
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/75 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">{copy.metadataPathLabel}</p>
                    <p className="mt-2 text-sm text-[var(--color-text)]">{selectedLocation.path_labels.join(" / ")}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/75 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">{copy.metadataChildrenLabel}</p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{selectedLocation.children_count}</p>
                    </div>
                    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/75 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">{copy.metadataDescendantsLabel}</p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{selectedLocation.descendants_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="ui-card ui-card-coming-soon p-5">
              <div className="flex items-start gap-4">
                <span className="ui-icon-badge ui-icon-badge-construction"><HistoryIcon className="h-[1.05rem] w-[1.05rem]" /></span>
                <div>
                  <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">{copy.historyTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-subtle)]">{copy.historyDescription}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="ui-panel px-6 py-6 text-sm text-[var(--color-text-muted)]">{copy.historyDescription}</div>
      )}

      {tab === "general" && portalTarget
        ? createPortal(
            <div className="mx-auto flex w-full max-w-[112rem] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8">
              <Link href={configurationPath} className="ui-button-secondary inline-flex items-center justify-center" onClick={(event: MouseEvent<HTMLAnchorElement>) => { if (isDirty && !window.confirm(copy.discardConfirm)) { event.preventDefault(); } }}>{copy.cancel}</Link>
              <div className="flex gap-2">
                {!isCreateMode && selectedLocation ? (
                  <button type="button" className="ui-button-danger" onClick={() => setIsDeletePending((previous) => !previous)} disabled={!selectedLocation.can_delete || isSaving}>{isDeletePending ? copy.undoDelete : copy.delete}</button>
                ) : null}
                <button type="button" className="ui-button-primary" onClick={() => void handleSave()} disabled={!directory || !canSubmit || isSaving || !isDirty}>{isSaving ? copy.saving : copy.save}</button>
              </div>
            </div>,
            portalTarget
          )
        : null}
    </section>
  );
}
