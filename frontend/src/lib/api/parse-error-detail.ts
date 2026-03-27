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

    if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        if (typeof first?.msg === "string" && first.msg.trim()) {
            return first.msg;
        }
    }

    return fallback ?? null;
}
