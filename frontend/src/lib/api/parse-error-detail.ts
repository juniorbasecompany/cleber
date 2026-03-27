/**
 * Extrai mensagem de erro de payloads JSON típicos de APIs (ex.: FastAPI `detail`).
 */
export function parseErrorDetail(
    payload: unknown,
    fallback?: string | null
): string | null {
    if (!payload || typeof payload !== "object") {
        return fallback ?? null;
    }

    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
        return detail;
    }

    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        const message = (detail as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) {
            return message.trim();
        }
    }

    if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        if (typeof first?.msg === "string" && first.msg.trim()) {
            return first.msg;
        }
    }

    return fallback ?? null;
}

/** Código estável quando a API devolve `detail: { code, message }` (ver skills/implementation/i18n). */
export function parseErrorCode(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") {
        return null;
    }
    const detail = (payload as { detail?: unknown }).detail;
    if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
        return null;
    }
    const code = (detail as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) {
        return code.trim();
    }
    return null;
}
