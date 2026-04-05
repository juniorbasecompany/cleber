"use client";

import { useCallback, useState } from "react";

import type { TenantKindRecord } from "@/lib/auth/types";
import { parseErrorDetail } from "@/lib/api/parse-error-detail";

export type KindSelectOrCreateCopy = {
  selectLabel: string;
  selectHint: string;
  selectPlaceholder: string;
  newKindButton: string;
  newNameLabel: string;
  newDisplayNameLabel: string;
  createKind: string;
  cancelNewKind: string;
  createError: string;
};

type Props = {
  selectId: string;
  scopeId: number;
  kindList: TenantKindRecord[];
  kindId: number | null;
  onKindIdChange: (value: number | null) => void;
  onKindListChange: (value: TenantKindRecord[]) => void;
  disabled: boolean;
  flashActive: boolean;
  fieldError?: string | null;
  onAfterFieldEdit: () => void;
  copy: KindSelectOrCreateCopy;
};

export function KindSelectOrCreateField({
  selectId,
  scopeId,
  kindList,
  kindId,
  onKindIdChange,
  onKindListChange,
  disabled,
  flashActive,
  fieldError,
  onAfterFieldEdit,
  copy
}: Props) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const raw = event.target.value;
      if (raw === "") {
        onKindIdChange(null);
        return;
      }
      const next = Number.parseInt(raw, 10);
      if (!Number.isNaN(next)) {
        onKindIdChange(next);
      }
      onAfterFieldEdit();
    },
    [onAfterFieldEdit, onKindIdChange]
  );

  const createKind = useCallback(async () => {
    const name = newName.trim();
    const displayName = newDisplayName.trim();
    if (!name || !displayName) {
      setCreateError(copy.createError);
      return;
    }
    setCreateError(null);
    setIsCreating(true);
    try {
      const response = await fetch(
        `/api/auth/tenant/current/scopes/${scopeId}/kind`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, display_name: displayName })
        }
      );
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCreateError(parseErrorDetail(data, copy.createError) ?? copy.createError);
        setIsCreating(false);
        return;
      }
      const nextList = (data as { item_list?: TenantKindRecord[] }).item_list ?? [];
      onKindListChange(nextList);
      const created = nextList.find((row) => row.name === name);
      if (created) {
        onKindIdChange(created.id);
      }
      setShowNew(false);
      setNewName("");
      setNewDisplayName("");
      onAfterFieldEdit();
    } catch {
      setCreateError(copy.createError);
    } finally {
      setIsCreating(false);
    }
  }, [
    copy.createError,
    newDisplayName,
    newName,
    onAfterFieldEdit,
    onKindIdChange,
    onKindListChange,
    scopeId
  ]);

  return (
    <div className="ui-field-stack">
      <label className="ui-field-label" htmlFor={selectId}>
        {copy.selectLabel}
      </label>
      <p className="ui-field-hint">{copy.selectHint}</p>
      <select
        id={selectId}
        className={
          flashActive ? "ui-field-control ui-field-control-flash" : "ui-field-control"
        }
        value={kindId != null ? String(kindId) : ""}
        onChange={handleSelectChange}
        disabled={disabled}
        aria-invalid={fieldError != null && fieldError !== ""}
      >
        <option value="">{copy.selectPlaceholder}</option>
        {kindList.map((row) => (
          <option key={row.id} value={String(row.id)}>
            {row.name.trim() || row.display_name.trim() || `#${row.id}`}
          </option>
        ))}
      </select>
      {fieldError ? <p className="ui-field-error">{fieldError}</p> : null}

      {!showNew ? (
        <button
          type="button"
          className="ui-button ui-button-secondary"
          disabled={disabled || isCreating}
          onClick={() => {
            setShowNew(true);
            setCreateError(null);
            onAfterFieldEdit();
          }}
        >
          {copy.newKindButton}
        </button>
      ) : (
        <div className="ui-kind-create-panel ui-field-stack">
          <label className="ui-field-label" htmlFor={`${selectId}-new-name`}>
            {copy.newNameLabel}
          </label>
          <input
            id={`${selectId}-new-name`}
            type="text"
            className="ui-field-control"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            disabled={disabled || isCreating}
          />
          <label className="ui-field-label" htmlFor={`${selectId}-new-display`}>
            {copy.newDisplayNameLabel}
          </label>
          <textarea
            id={`${selectId}-new-display`}
            className="ui-field-control"
            rows={2}
            value={newDisplayName}
            onChange={(event) => setNewDisplayName(event.target.value)}
            disabled={disabled || isCreating}
          />
          {createError ? <p className="ui-field-error">{createError}</p> : null}
          <div className="ui-button-row">
            <button
              type="button"
              className="ui-button ui-button-primary"
              disabled={disabled || isCreating}
              onClick={() => void createKind()}
            >
              {copy.createKind}
            </button>
            <button
              type="button"
              className="ui-button ui-button-ghost"
              disabled={disabled || isCreating}
              onClick={() => {
                setShowNew(false);
                setCreateError(null);
                onAfterFieldEdit();
              }}
            >
              {copy.cancelNewKind}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
