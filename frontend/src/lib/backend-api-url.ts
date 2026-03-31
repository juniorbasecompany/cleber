/**
 * URL base do backend HTTP exposto ao browser e ao servidor Next (RSC e rotas `/api`).
 * Deve ser a mesma fonte em todo o frontend para evitar dois backends por acidente.
 */
export function getPublicApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003";
}
