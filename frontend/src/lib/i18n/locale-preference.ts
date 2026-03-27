import { routing } from "@/i18n/routing";

/** Chave em localStorage para o último locale escolhido neste browser. */
export const localeStorageKey = "valora.locale";

const localeSet = new Set<string>(routing.locales);

export function isSupportedLocale(value: string | null | undefined): value is string {
  return value != null && value !== "" && localeSet.has(value);
}

export function readStoredLocale(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(localeStorageKey);
    return isSupportedLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: string): void {
  if (typeof window === "undefined" || !isSupportedLocale(locale)) {
    return;
  }

  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    /* ignorar quota / modo privado */
  }
}

export function getLocaleHref(
  pathname: string,
  searchParams: { toString(): string },
  locale: string
): string {
  const pathSegmentList = pathname.split("/");
  if (pathSegmentList.length > 1) {
    pathSegmentList[1] = locale;
  }

  const nextPathname = pathSegmentList.join("/") || `/${locale}`;
  const search = searchParams.toString();
  return search ? `${nextPathname}?${search}` : nextPathname;
}
