"use client";

import type { ReactNode } from "react";

import type { DirectoryFilterStorageSegment } from "@/component/configuration/directory-filter-visibility";
import { useDirectoryFilterPanelVisible } from "@/component/configuration/directory-filter-visibility";

export type DirectoryFilterConfig = {
  panel: ReactNode;
  storageSegment: DirectoryFilterStorageSegment;
};

type ConfigurationDirectoryFilterTopSlotProps = {
  filter: DirectoryFilterConfig | undefined;
};

/** Renderiza o painel laranja de filtros só quando o estado persistido indica visível. */
export function ConfigurationDirectoryFilterTopSlot({
  filter
}: ConfigurationDirectoryFilterTopSlotProps) {
  const visible = useDirectoryFilterPanelVisible(filter?.storageSegment);
  if (!filter?.panel || !visible) {
    return null;
  }
  return <>{filter.panel}</>;
}
