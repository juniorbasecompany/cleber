"use client";

import { useEffect, useRef, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";

import { LocaleFlagSvg } from "@/component/i18n/locale-flag-svg";
import {
  getLocaleHref,
  writeStoredLocale
} from "@/lib/i18n/locale-preference";

type LocaleFlagMenuCopy = {
  triggerAriaLabel: string;
  menuAriaLabel: string;
  switchingLocale: string;
  activeLabel: string;
};

type LocaleFlagMenuProps = {
  currentLocale: string;
  localeList: string[];
  copy: LocaleFlagMenuCopy;
};

const localeLabelMap: Record<string, string> = {
  "pt-BR": "Português (Brasil)",
  "en-US": "English (United States)",
  "es-ES": "Español (España)"
};

export function LocaleFlagMenu({
  currentLocale,
  localeList,
  copy
}: LocaleFlagMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [switchingLocale, setSwitchingLocale] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleLocaleSelect(locale: string) {
    if (switchingLocale) {
      return;
    }

    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    writeStoredLocale(locale);
    setSwitchingLocale(locale);
    setIsOpen(false);
    router.push(getLocaleHref(pathname, searchParams, locale));
  }

  const optionClass = (isActive: boolean) =>
    `ui-menu-item flex w-full min-h-[2.75rem] items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
      isActive ? "ui-menu-item-active" : ""
    }`;

  return (
    <div ref={containerRef} className="relative isolate">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={copy.triggerAriaLabel}
        data-state={isOpen ? "open" : "closed"}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="ui-menu-trigger inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)]"
      >
        <LocaleFlagSvg locale={currentLocale} size="trigger" />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={copy.menuAriaLabel}
          className="ui-menu-panel absolute right-0 top-[calc(100%+0.375rem)] z-40 flex min-w-[19rem] max-w-[min(calc(100vw-2rem),22rem)] flex-col gap-0 overflow-hidden p-2"
        >
          {switchingLocale ? (
            <div className="mb-1 flex justify-end px-1">
              <span className="text-xs text-[var(--color-text-subtle)]">
                {copy.switchingLocale}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col gap-0.5">
            {localeList.map((locale) => {
              const isActive = locale === currentLocale;
              const localeLabel = localeLabelMap[locale] || locale;

              return (
                <button
                  key={locale}
                  type="button"
                  role="menuitem"
                  onClick={() => handleLocaleSelect(locale)}
                  disabled={switchingLocale !== null}
                  className={optionClass(isActive)}
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <LocaleFlagSvg locale={locale} size="menu" />
                    <span className="truncate">{localeLabel}</span>
                  </span>
                  {isActive ? (
                    <span className="ui-menu-badge">{copy.activeLabel}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
