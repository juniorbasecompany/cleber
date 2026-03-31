"use client";

import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TrashIcon } from "@/component/ui/ui-icons";
import { useTranslations } from "next-intl";
import { useMemo, type CSSProperties } from "react";

export type ActionFormulaDraftRow = {
    clientKey: string;
    serverId?: number;
    statement: string;
    pendingDelete: boolean;
};

type ActionFormulaSectionProps = {
    canEdit: boolean;
    disabled: boolean;
    isLoading: boolean;
    rowList: ActionFormulaDraftRow[];
    onChangeRowList: (next: ActionFormulaDraftRow[]) => void;
    onAdd: () => void;
};

type FormulaRowCopy = {
    statementLabel: string;
    dragHandleAria: string;
    removeAriaLabel: string;
    unmarkAriaLabel: string;
};

function SortableFormulaRow({
    row,
    canEdit,
    disabled,
    copy,
    onChangeStatement,
    onToggleRemove
}: {
    row: ActionFormulaDraftRow;
    canEdit: boolean;
    disabled: boolean;
    copy: FormulaRowCopy;
    onChangeStatement: (statement: string) => void;
    onToggleRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.clientKey,
        disabled: disabled || !canEdit || row.pendingDelete
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.92 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="ui-card ui-form-section ui-border-accent ui-card-stack ui-formula-sortable-row"
            data-dragging={isDragging ? "true" : undefined}
            data-delete-pending={row.pendingDelete ? "true" : undefined}
        >
            <div className="ui-formula-row-layout">
                <div className="ui-formula-row-field ui-field">
                    <label className="ui-field-label" htmlFor={`formula-stmt-${row.clientKey}`}>
                        {copy.statementLabel}
                    </label>
                    <textarea
                        id={`formula-stmt-${row.clientKey}`}
                        className="ui-input"
                        rows={3}
                        value={row.statement}
                        onChange={(event) => onChangeStatement(event.target.value)}
                        disabled={disabled || !canEdit || row.pendingDelete}
                        autoComplete="off"
                    />
                </div>
                <div className="ui-formula-row-actions">
                    <button
                        type="button"
                        className="ui-formula-drag-handle"
                        disabled={disabled || !canEdit || row.pendingDelete}
                        aria-label={copy.dragHandleAria}
                        {...attributes}
                        {...listeners}
                    >
                        <span aria-hidden>{"⋮⋮"}</span>
                    </button>
                    {canEdit ? (
                        <button
                            type="button"
                            className={
                                row.pendingDelete
                                    ? "ui-formula-trash-button ui-formula-trash-button--marked"
                                    : "ui-formula-trash-button"
                            }
                            aria-label={
                                row.pendingDelete ? copy.unmarkAriaLabel : copy.removeAriaLabel
                            }
                            disabled={disabled}
                            onClick={onToggleRemove}
                        >
                            <TrashIcon />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export function ActionFormulaSection({
    canEdit,
    disabled,
    isLoading,
    rowList,
    onChangeRowList,
    onAdd
}: ActionFormulaSectionProps) {
    const t = useTranslations("ActionConfigurationPage.formulas");

    const rowCopy: FormulaRowCopy = {
        statementLabel: t("statementLabel"),
        dragHandleAria: t("dragHandleAria"),
        removeAriaLabel: t("removeAriaLabel"),
        unmarkAriaLabel: t("unmarkAriaLabel")
    };

    const sortableIdList = useMemo(() => rowList.map((r) => r.clientKey), [rowList]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }
        const oldIndex = rowList.findIndex((r) => r.clientKey === active.id);
        const newIndex = rowList.findIndex((r) => r.clientKey === over.id);
        if (oldIndex < 0 || newIndex < 0) {
            return;
        }
        onChangeRowList(arrayMove(rowList, oldIndex, newIndex));
    };

    const updateRow = (clientKey: string, patch: Partial<ActionFormulaDraftRow>) => {
        onChangeRowList(
            rowList.map((row) => (row.clientKey === clientKey ? { ...row, ...patch } : row))
        );
    };

    return (
        <section className="ui-card ui-form-section ui-border-accent">
            <h3 className="ui-field-label" style={{ marginBottom: "0.35rem" }}>
                {t("title")}
            </h3>
            <div
                className="ui-field-hint"
                style={{ marginBottom: "0.75rem", whiteSpace: "pre-line" }}
            >
                {t("description")}
            </div>

            {isLoading ? (
                <p className="ui-field-hint">{t("loading")}</p>
            ) : rowList.length === 0 ? (
                <p className="ui-field-hint">{t("empty")}</p>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortableIdList} strategy={verticalListSortingStrategy}>
                        <div className="ui-card-stack" style={{ gap: "0.75rem" }}>
                            {rowList.map((row) => (
                                <SortableFormulaRow
                                    key={row.clientKey}
                                    row={row}
                                    canEdit={canEdit}
                                    disabled={disabled}
                                    copy={rowCopy}
                                    onChangeStatement={(statement) => updateRow(row.clientKey, { statement })}
                                    onToggleRemove={() =>
                                        updateRow(row.clientKey, { pendingDelete: !row.pendingDelete })
                                    }
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {canEdit ? (
                <div style={{ marginTop: "0.75rem" }}>
                    <button
                        type="button"
                        className="ui-button-secondary"
                        disabled={disabled || isLoading}
                        onClick={onAdd}
                    >
                        {t("newFormula")}
                    </button>
                </div>
            ) : null}
        </section>
    );
}
