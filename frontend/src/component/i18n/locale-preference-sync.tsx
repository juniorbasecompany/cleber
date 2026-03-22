"use client";

import { useLayoutEffect } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";

import {
  getLocaleHref,
  readStoredLocale
} from "@/lib/i18n/locale-preference";

type LocalePreferenceSyncProps = {
  locale: string;
};

export function LocalePreferenceSync({ locale }: LocalePreferenceSyncProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useLayoutEffect(() => {
    const stored = readStoredLocale();
    if (!stored || stored === locale) {
      return;
    }

    router.replace(
      getLocaleHref(pathname, { toString: () => search }, stored)
    );
  }, [locale, pathname, router, search]);

  return null;
}
