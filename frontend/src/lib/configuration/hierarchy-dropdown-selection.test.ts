import { describe, expect, it } from "vitest";

import {
  expandSelectedIdsWithAncestors,
  toggleIndependentHierarchySelection
} from "./hierarchy-dropdown-selection";

const parentById = new Map<number, number | null>([
  [1, null],
  [2, 1],
  [3, 1],
  [4, 2],
  [5, 2]
]);

const childrenById = new Map<number, number[]>([
  [1, [2, 3]],
  [2, [4, 5]],
  [3, []],
  [4, []],
  [5, []]
]);

function getParentIdById(id: number) {
  return parentById.get(id) ?? null;
}

function getChildrenIdsByParentId(id: number) {
  return childrenById.get(id) ?? [];
}

describe("hierarchy dropdown independent selection", () => {
  it("expands the visual selection to include ancestors", () => {
    expect(
      [...expandSelectedIdsWithAncestors([4], getParentIdById)].sort((a, b) => a - b)
    ).toEqual([1, 2, 4]);
  });

  it("adds a new pick when selecting an unrelated node", () => {
    expect(
      toggleIndependentHierarchySelection(
        [4],
        3,
        getParentIdById,
        getChildrenIdsByParentId
      )
    ).toEqual([4, 3]);
  });

  it("replaces selected ancestors with the newly selected descendant", () => {
    expect(
      toggleIndependentHierarchySelection(
        [2],
        4,
        getParentIdById,
        getChildrenIdsByParentId
      )
    ).toEqual([4]);
  });

  it("removes all descendant picks when deselecting an ancestor", () => {
    expect(
      toggleIndependentHierarchySelection(
        [4, 5, 3],
        2,
        getParentIdById,
        getChildrenIdsByParentId
      )
    ).toEqual([3]);
  });
});
