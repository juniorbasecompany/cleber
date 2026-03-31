/**
 * Persistência de fórmulas no painel da ação: evita colisão UNIQUE (action_id, step)
 * ao reordenar ou inserir linhas novas entre existentes.
 */

export type FormulaPersistRow = {
    serverId?: number;
    statement: string;
};

/** Formato mínimo vindo do painel (rascunho). */
export type FormulaDraftRowPersist = {
    serverId?: number;
    statement: string;
    pendingDelete: boolean;
};

const TEMP_STEP_OFFSET = 10_000_000;

function serverIdsInOrder(rows: { serverId?: number }[]): number[] {
    return rows.filter((r): r is { serverId: number } => r.serverId != null).map((r) => r.serverId);
}

/**
 * Indica se precisamos da fase de passos temporários altos antes de gravar a ordem final.
 */
export function actionFormulaNeedsTempPhase(
    activeRows: FormulaPersistRow[],
    baselineServerIdsInOrder: number[]
): boolean {
    const hasNew = activeRows.some((r) => r.serverId == null);
    if (hasNew) {
        return true;
    }
    const current = serverIdsInOrder(activeRows);
    if (current.length === 0) {
        return false;
    }
    if (current.length >= 2) {
        return JSON.stringify(current) !== JSON.stringify(baselineServerIdsInOrder);
    }
    return false;
}

export type PersistActionFormulaOptions = {
    scopeId: number;
    actionId: number;
    /** Linhas ativas em ordem (sem pendingDelete). */
    activeRows: FormulaPersistRow[];
    /** IDs de fórmulas a remover antes do restante. */
    pendingDeleteIdList: number[];
    baselineServerIdsInOrder: number[];
    fetchImpl?: typeof fetch;
};

function formulaBasePath(scopeId: number, actionId: number): string {
    return `/api/auth/tenant/current/scopes/${scopeId}/actions/${actionId}/formulas`;
}

/**
 * Aplica exclusões, reordenação e criações. Lança Error com mensagem amigável se falhar.
 */
export async function persistActionFormulaDraft(
    options: PersistActionFormulaOptions
): Promise<void> {
    const {
        scopeId,
        actionId,
        activeRows,
        pendingDeleteIdList,
        baselineServerIdsInOrder,
        fetchImpl = fetch
    } = options;

    const base = formulaBasePath(scopeId, actionId);

    for (const id of pendingDeleteIdList) {
        const response = await fetchImpl(`${base}/${id}`, { method: "DELETE" });
        if (!response.ok) {
            const body: unknown = await response.json().catch(() => ({}));
            throw new Error(extractDetail(body, "Não foi possível excluir a fórmula."));
        }
    }

    if (activeRows.length === 0) {
        return;
    }

    const serverRows = activeRows.filter((r): r is FormulaPersistRow & { serverId: number } => {
        return r.serverId != null;
    });

    const needsTemp = actionFormulaNeedsTempPhase(activeRows, baselineServerIdsInOrder);

    if (needsTemp && serverRows.length > 0) {
        for (const row of serverRows) {
            const response = await fetchImpl(`${base}/${row.serverId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: TEMP_STEP_OFFSET + row.serverId })
            });
            if (!response.ok) {
                const body: unknown = await response.json().catch(() => ({}));
                throw new Error(extractDetail(body, "Não foi possível reordenar as fórmulas."));
            }
        }
    }

    let position = 1;
    for (const row of activeRows) {
        const trimmed = row.statement.trim();
        if (row.serverId != null) {
            const response = await fetchImpl(`${base}/${row.serverId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: position, statement: trimmed })
            });
            if (!response.ok) {
                const body: unknown = await response.json().catch(() => ({}));
                throw new Error(extractDetail(body, "Não foi possível gravar a fórmula."));
            }
        } else {
            const response = await fetchImpl(base, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: position, statement: trimmed })
            });
            if (!response.ok) {
                const body: unknown = await response.json().catch(() => ({}));
                throw new Error(extractDetail(body, "Não foi possível criar a fórmula."));
            }
        }
        position += 1;
    }
}

/**
 * Apenas alterações de texto na mesma ordem: um PATCH por linha que mudou.
 */
export async function persistActionFormulaStatementOnly(
    options: Omit<PersistActionFormulaOptions, "baselineServerIdsInOrder"> & {
        /** Mapa serverId -> statement anterior (trimmed). */
        baselineStatementById: Map<number, string>;
    }
): Promise<void> {
    const { scopeId, actionId, activeRows, pendingDeleteIdList, baselineStatementById, fetchImpl = fetch } =
        options;
    const base = formulaBasePath(scopeId, actionId);

    for (const id of pendingDeleteIdList) {
        const response = await fetchImpl(`${base}/${id}`, { method: "DELETE" });
        if (!response.ok) {
            const body: unknown = await response.json().catch(() => ({}));
            throw new Error(extractDetail(body, "Não foi possível excluir a fórmula."));
        }
    }

    for (const row of activeRows) {
        if (row.serverId == null) {
            continue;
        }
        const trimmed = row.statement.trim();
        const previous = baselineStatementById.get(row.serverId) ?? "";
        if (trimmed === previous) {
            continue;
        }
        const response = await fetchImpl(`${base}/${row.serverId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statement: trimmed })
        });
        if (!response.ok) {
            const body: unknown = await response.json().catch(() => ({}));
            throw new Error(extractDetail(body, "Não foi possível gravar a fórmula."));
        }
    }
}

function extractDetail(body: unknown, fallback: string): string {
    if (body && typeof body === "object" && "detail" in body) {
        const detail = (body as { detail?: unknown }).detail;
        if (typeof detail === "string" && detail.trim()) {
            return detail.trim();
        }
    }
    return fallback;
}

/**
 * Ordem dos IDs no baseline original, restrita aos que ainda estão ativos no rascunho (sem exclusão pendente).
 */
function baselineServerIdsInOrderForActive(
    baselineRowList: FormulaDraftRowPersist[],
    activeRowList: FormulaPersistRow[]
): number[] {
    const activeIdSet = new Set(
        activeRowList.filter((r) => r.serverId != null).map((r) => r.serverId!)
    );
    return baselineRowList
        .filter((r) => r.serverId != null && activeIdSet.has(r.serverId))
        .map((r) => r.serverId!);
}

/**
 * Escolhe entre persistência só de texto (e exclusões) ou reordenação completa com fase temporária.
 */
export async function runActionFormulaPersist(input: {
    scopeId: number;
    actionId: number;
    draftRowList: FormulaDraftRowPersist[];
    baselineRowList: FormulaDraftRowPersist[];
    fetchImpl?: typeof fetch;
}): Promise<void> {
    const { scopeId, actionId, draftRowList, baselineRowList, fetchImpl } = input;

    const pendingDeleteIdList = draftRowList
        .filter((r) => r.pendingDelete && r.serverId != null)
        .map((r) => r.serverId!);

    const activeRowList = draftRowList
        .filter((r) => !r.pendingDelete)
        .map((r) => ({ serverId: r.serverId, statement: r.statement }));

    const baselineServerIdsInOrder = baselineServerIdsInOrderForActive(baselineRowList, activeRowList);

    if (actionFormulaNeedsTempPhase(activeRowList, baselineServerIdsInOrder)) {
        await persistActionFormulaDraft({
            scopeId,
            actionId,
            activeRows: activeRowList,
            pendingDeleteIdList,
            baselineServerIdsInOrder,
            fetchImpl
        });
        return;
    }

    const baselineStatementById = new Map<number, string>();
    for (const row of baselineRowList) {
        if (row.serverId != null) {
            baselineStatementById.set(row.serverId, row.statement.trim());
        }
    }

    await persistActionFormulaStatementOnly({
        scopeId,
        actionId,
        activeRows: activeRowList,
        pendingDeleteIdList,
        baselineStatementById,
        fetchImpl
    });
}
