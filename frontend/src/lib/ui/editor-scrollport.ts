/** Seletor do scroll principal do app shell (área útil do editor). */
export const APP_SHELL_MAIN_SCROLL_SELECTOR = ".ui-shell-main-scroll";

export function isOverflowYScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    const canScroll =
        overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay";
    return canScroll && element.scrollHeight > element.clientHeight;
}

/** Resolve o elemento que faz scroll vertical em torno do painel do editor. */
export function resolveEditorScrollport(panel: HTMLElement): HTMLElement | null {
    const byShell = panel.closest(APP_SHELL_MAIN_SCROLL_SELECTOR);
    if (byShell instanceof HTMLElement) {
        return byShell;
    }
    let current: HTMLElement | null = panel.parentElement;
    while (current) {
        if (isOverflowYScrollable(current)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}

/** Topo do painel já está na zona útil do scrollport (folga de scroll-margin-top). */
export function isEditorPanelTopVisibleInScrollport(panel: HTMLElement): boolean {
    const scrollport = resolveEditorScrollport(panel);
    const panelRect = panel.getBoundingClientRect();
    const marginTopPx =
        Number.parseFloat(window.getComputedStyle(panel).scrollMarginTop) || 0;
    const epsilonPx = 0.5;

    if (scrollport) {
        const scrollRect = scrollport.getBoundingClientRect();
        return panelRect.top >= scrollRect.top + marginTopPx - epsilonPx;
    }

    return panelRect.top >= marginTopPx - epsilonPx;
}
