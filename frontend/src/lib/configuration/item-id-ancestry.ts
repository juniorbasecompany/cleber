import type { TenantItemRecord } from "@/lib/auth/types";

export function buildItemByIdMap(
  itemList: TenantItemRecord[]
): Map<number, TenantItemRecord> {
  return new Map(itemList.map((item) => [item.id, item]));
}

function isStrictDescendantOf(
  descendantId: number,
  ancestorId: number,
  itemById: Map<number, TenantItemRecord>
): boolean {
  let current = itemById.get(descendantId)?.parent_item_id ?? null;
  while (current != null) {
    if (current === ancestorId) {
      return true;
    }
    current = itemById.get(current)?.parent_item_id ?? null;
  }
  return false;
}

/**
 * Reduz uma lista persistida (ancestrais + nós) ao conjunto mínimo de "picks" na árvore:
 * mantém só ids que não têm outro id da lista como descendente estrito.
 */
export function frontierPickedIdsFromStoredList(
  storedIdList: number[],
  itemById: Map<number, TenantItemRecord>
): number[] {
  const idSet = new Set(storedIdList);
  return storedIdList.filter(
    (id) =>
      ![...idSet].some(
        (other) => other !== id && isStrictDescendantOf(other, id, itemById)
      )
  );
}

/**
 * Para cada pick, inclui o id e todos os ancestrais (até a raiz), na ordem raiz→folha,
 * deduplicando pela primeira ocorrência global.
 */
export function expandPickedItemIdsToStoredList(
  pickIdList: number[],
  itemById: Map<number, TenantItemRecord>
): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const pick of pickIdList) {
    const chain: number[] = [];
    let current: number | null = pick;
    while (current != null) {
      chain.push(current);
      current = itemById.get(current)?.parent_item_id ?? null;
    }
    chain.reverse();
    for (const id of chain) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

export function areItemIdSetsEqual(a: number[], b: number[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) {
    return false;
  }
  for (const id of setA) {
    if (!setB.has(id)) {
      return false;
    }
  }
  return true;
}
