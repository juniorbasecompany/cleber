import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { isEditorPanelTopVisibleInScrollport } from "@/lib/ui/editor-scrollport";

/**
 * Destaque visual ao mudar o registro em foco no painel do editor (scroll + flash).
 */
export function useEditorPanelFlash(
    panelRef: RefObject<HTMLElement | null>,
    flashKey: string | null
): boolean {
    const [isFlashActive, setIsFlashActive] = useState(false);
    const startTimeoutRef = useRef<number | null>(null);
    const hideTimeoutRef = useRef<number | null>(null);
    const cancelAfterScrollRef = useRef<(() => void) | null>(null);
    const previousKeyRef = useRef<string | null>(null);

    const triggerFlash = useCallback(() => {
        if (startTimeoutRef.current != null) {
            window.clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
        }
        if (hideTimeoutRef.current != null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        cancelAfterScrollRef.current?.();
        cancelAfterScrollRef.current = null;

        setIsFlashActive(false);
        startTimeoutRef.current = window.setTimeout(() => {
            startTimeoutRef.current = null;

            const panel = panelRef.current;
            if (!panel) {
                return;
            }

            let aborted = false;
            let flashStarted = false;
            const FLASH_MS = 960;
            const SCROLL_END_FALLBACK_MS = 900;
            const scrollEndSupported =
                typeof Document !== "undefined" && "onscrollend" in Document.prototype;

            let fallbackTimeoutId = 0;

            const cleanupWait = () => {
                window.clearTimeout(fallbackTimeoutId);
                document.removeEventListener("scrollend", onScrollEnd);
                cancelAfterScrollRef.current = null;
            };

            const startFlash = () => {
                if (aborted || flashStarted) {
                    return;
                }
                flashStarted = true;
                cleanupWait();
                setIsFlashActive(true);
                hideTimeoutRef.current = window.setTimeout(() => {
                    setIsFlashActive(false);
                    hideTimeoutRef.current = null;
                }, FLASH_MS);
            };

            const onScrollEnd = () => {
                startFlash();
            };

            if (isEditorPanelTopVisibleInScrollport(panel)) {
                startFlash();
                return;
            }

            panel.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest"
            });

            if (scrollEndSupported) {
                document.addEventListener("scrollend", onScrollEnd, { passive: true });
            }
            const fallbackMs = scrollEndSupported ? SCROLL_END_FALLBACK_MS : 480;
            fallbackTimeoutId = window.setTimeout(startFlash, fallbackMs);

            cancelAfterScrollRef.current = () => {
                aborted = true;
                cleanupWait();
            };
        }, 24);
    }, [panelRef]);

    useEffect(() => {
        if (!flashKey) {
            previousKeyRef.current = null;
            return;
        }

        if (previousKeyRef.current === null) {
            previousKeyRef.current = flashKey;
            triggerFlash();
            return;
        }

        if (previousKeyRef.current === flashKey) {
            return;
        }

        previousKeyRef.current = flashKey;
        triggerFlash();
    }, [flashKey, triggerFlash]);

    useEffect(() => {
        return () => {
            if (startTimeoutRef.current != null) {
                window.clearTimeout(startTimeoutRef.current);
            }
            if (hideTimeoutRef.current != null) {
                window.clearTimeout(hideTimeoutRef.current);
            }
            cancelAfterScrollRef.current?.();
            cancelAfterScrollRef.current = null;
        };
    }, []);

    return isFlashActive;
}
