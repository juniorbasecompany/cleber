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
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";

type ScopeRulesDirectorySortableListProps<T extends { id: number }> = {
  itemList: T[];
  dragDisabled: boolean;
  dragHandleAriaLabel: string;
  onReorder: (nextList: T[]) => void | Promise<void>;
  /** Cartão com `ui-directory-item`; colocar `dragHandle` à direita dentro do cartão. */
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
};

function SortableDirectoryRow<T extends { id: number }>({
  item,
  dragDisabled,
  dragHandleAriaLabel,
  renderItem
}: {
  item: T;
  dragDisabled: boolean;
  dragHandleAriaLabel: string;
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
    disabled: dragDisabled
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1
  };

  const dragHandle = (
    <button
      type="button"
      className="ui-scope-rules-directory-drag-handle"
      disabled={dragDisabled}
      aria-label={dragHandleAriaLabel}
      {...attributes}
      {...listeners}
    >
      <span aria-hidden>{"⋮⋮"}</span>
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="ui-scope-rules-directory-sortable-row"
      data-dragging={isDragging ? "true" : undefined}
    >
      {renderItem(item, dragHandle)}
    </div>
  );
}

export function ScopeRulesDirectorySortableList<T extends { id: number }>(
  props: ScopeRulesDirectorySortableListProps<T>
) {
  const { itemList, dragDisabled, dragHandleAriaLabel, onReorder, renderItem } = props;

  const sortableIdList = useMemo(() => itemList.map((item) => String(item.id)), [itemList]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (dragDisabled) {
      return;
    }
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = itemList.findIndex((row) => String(row.id) === String(active.id));
    const newIndex = itemList.findIndex((row) => String(row.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    void onReorder(arrayMove(itemList, oldIndex, newIndex));
  };

  /* `id` fixo no DndContext: o @dnd-kit usa contador global para DndDescribedBy; sem `id`, SSR e cliente divergem com vários contextos na página. */
  return (
    <DndContext
      id="configuration-scope-rules-directory"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIdList} strategy={verticalListSortingStrategy}>
        {itemList.map((item) => (
          <SortableDirectoryRow
            key={item.id}
            item={item}
            dragDisabled={dragDisabled}
            dragHandleAriaLabel={dragHandleAriaLabel}
            renderItem={renderItem}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
