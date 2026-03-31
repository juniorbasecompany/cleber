/**
 * Conversão entre o valor persistido em `field.type` (PostgreSQL) e o editor guiado por lista.
 */

/** Escala máxima permitida na UI para `NUMERIC(15, scale)` (0 a este valor, inclusive). */
export const FIELD_NUMERIC_MAX_SCALE = 10;

export type FieldSqlKind = "number" | "text" | "boolean" | "timestamp" | "legacy";

export type ParsedFieldSqlType = {
    kind: FieldSqlKind;
    /** Presente quando `kind === "number"` (escala de NUMERIC(15, scale)). */
    scale?: number;
};

const NUMERIC_15 = /^NUMERIC\s*\(\s*15\s*,\s*(\d+)\s*\)\s*$/i;

/**
 * Interpreta a string salva no servidor.
 */
export function parseFieldSqlType(raw: string): ParsedFieldSqlType {
    const s = raw.trim();
    if (!s) {
        return { kind: "legacy" };
    }

    const numericMatch = NUMERIC_15.exec(s);
    if (numericMatch) {
        const scale = Number(numericMatch[1]);
        if (Number.isInteger(scale) && scale >= 0 && scale <= FIELD_NUMERIC_MAX_SCALE) {
            return { kind: "number", scale };
        }
        return { kind: "legacy" };
    }

    if (/^TEXT$/i.test(s)) {
        return { kind: "text" };
    }
    if (/^BOOLEAN$/i.test(s)) {
        return { kind: "boolean" };
    }
    if (/^TIMESTAMP$/i.test(s)) {
        return { kind: "timestamp" };
    }

    return { kind: "legacy" };
}

/**
 * Monta a string enviada à API. Para `legacy`, devolver o texto existente (não chamar com legacy vazio).
 */
export function buildFieldSqlType(parsed: ParsedFieldSqlType, legacyFallback = ""): string {
    if (parsed.kind === "number") {
        const scale = clampScale(parsed.scale ?? 0);
        return `NUMERIC(15,${scale})`;
    }
    if (parsed.kind === "text") {
        return "TEXT";
    }
    if (parsed.kind === "boolean") {
        return "BOOLEAN";
    }
    if (parsed.kind === "timestamp") {
        return "TIMESTAMP";
    }
    return legacyFallback.trim();
}

export function clampScale(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, Math.min(FIELD_NUMERIC_MAX_SCALE, Math.trunc(value)));
}

export function truncateFieldSqlPreview(raw: string, maxLength: number): string {
    const s = raw.trim();
    if (s.length <= maxLength) {
        return s;
    }
    return `${s.slice(0, Math.max(0, maxLength - 1))}…`;
}
