export const authTokenCookieName = "valora_access_token";
/** Cookie httpOnly espelha se a sessão é persistente ("1") ou só do browser ("0"). */
export const authPersistCookieName = "valora_auth_persist";
export const googleIdTokenStorageKey = "valora_google_id_token";
export const tenantSelectionStorageKey = "valora_tenant_selection";
/** Preferência "permanecer logado" entre login Google e escolha de licenciado (sessionStorage). */
export const rememberMeChoiceStorageKey = "valora_remember_me_choice";

/** Duração do cookie persistente e do JWT `remember_me` (30 dias a partir do último login). */
export const authRememberMeMaxAgeSeconds = 60 * 60 * 24 * 30;

export function hasAuthSession(tokenValue?: string | null) {
  return Boolean(tokenValue && tokenValue.trim().length > 0);
}

export function parseRememberMeFromBody(body: { remember_me?: unknown }): boolean {
  return body.remember_me === true;
}

export function isPersistentAuthFromCookieValue(value: string | undefined | null) {
  return value === "1";
}
