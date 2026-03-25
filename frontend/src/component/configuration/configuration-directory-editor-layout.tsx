"use client";

import { useEffect, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

import { PageHeader } from "@/component/app-shell/page-header";
import {
    ConfigurationEditorFooter,
    type ConfigurationEditorFooterProps
} from "@/component/configuration/configuration-editor-footer";
import { ConfigurationHistoryPlaceholder } from "@/component/configuration/configuration-history-placeholder";

export type ConfigurationDirectoryEditorLayoutProps = {
    headerTitle: string;
    headerDescription: string;
    directoryAside: ReactNode;
    editorPanelRef: RefObject<HTMLDivElement | null>;
    isDeletePending?: boolean;
    editorBody: ReactNode;
    history: {
        headingId: string;
        title: string;
        description: string;
    };
    footer: ConfigurationEditorFooterProps;
};

/**
 * Casca partilhada das telas de configuração com diretório + editor (escopo, locais, …).
 * Lista vs árvore e conteúdo do editor ficam nos slots; regras de negócio permanecem no pai.
 */
export function ConfigurationDirectoryEditorLayout({
    headerTitle,
    headerDescription,
    directoryAside,
    editorPanelRef,
    isDeletePending,
    editorBody,
    history,
    footer
}: ConfigurationDirectoryEditorLayoutProps) {
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalTarget(document.getElementById("app-shell-footer-slot"));
    }, []);

    return (
        <section className="ui-page-stack ui-page-stack-footer">
            <PageHeader title={headerTitle} description={headerDescription} />

            <div className="ui-layout-directory ui-layout-directory-editor">
                <aside className="ui-panel ui-stack-lg ui-panel-context-card">
                    {directoryAside}
                </aside>

                <div
                    ref={editorPanelRef}
                    className="ui-panel ui-panel-editor ui-editor-panel"
                    data-delete-pending={isDeletePending ? "true" : undefined}
                >
                    <div className="ui-editor-panel-body">{editorBody}</div>
                </div>
            </div>

            <ConfigurationHistoryPlaceholder
                headingId={history.headingId}
                title={history.title}
                description={history.description}
            />

            {portalTarget
                ? createPortal(<ConfigurationEditorFooter {...footer} />, portalTarget)
                : null}
        </section>
    );
}
