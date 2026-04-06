"use client";

import { useSyncExternalStore } from "react";

import type { AuditLogTableName } from "@/lib/auth/types";

const STORAGE_KEY_PREFIX = "valora.configuration.historyVisible.";

function storageKey(segment: AuditLogTableName): string {
  return STORAGE_KEY_PREFIX + segment;
}

function readStored(segment: AuditLogTableName | undefined): boolean {
  if (segment == null || typeof window === "undefined") {
    return true;
  }
  try {
    const stored = localStorage.getItem(storageKey(segment));
    return stored == null ? true : stored === "true";
  } catch {
    return true;
  }
}

function writeStored(segment: AuditLogTableName, value: boolean): void {
  try {
    localStorage.setItem(storageKey(segment), value ? "true" : "false");
  } catch {
    /* quota ou modo privado */
  }
}

const listenerMap = new Map<AuditLogTableName, Set<() => void>>();

function emit(segment: AuditLogTableName): void {
  listenerMap.get(segment)?.forEach((listener) => listener());
}

function subscribe(segment: AuditLogTableName | undefined, onChange: () => void): () => void {
  if (segment == null) {
    return () => {};
  }

  let set = listenerMap.get(segment);
  if (!set) {
    set = new Set();
    listenerMap.set(segment, set);
  }
  set.add(onChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(segment)) {
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set?.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setHistoryPanelVisible(segment: AuditLogTableName, value: boolean): void {
  writeStored(segment, value);
  emit(segment);
}

export function toggleHistoryPanelVisible(segment: AuditLogTableName): void {
  setHistoryPanelVisible(segment, !readStored(segment));
}

export function useHistoryPanelVisible(segment: AuditLogTableName | undefined): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(segment, onChange),
    () => readStored(segment),
    () => true
  );
}
