"use client";

import type { ReactNode } from "react";

import {
    ConfigurationDirectoryEditorLayout,
    type ConfigurationDirectoryEditorLayoutProps
} from "@/component/configuration/configuration-directory-editor-layout";

type LayoutPropsWithoutEditorBody = Omit<
    ConfigurationDirectoryEditorLayoutProps,
    "editorBody"
>;

type ShellAlwaysShowFormProps = LayoutPropsWithoutEditorBody & {
    /** Padrão: formulário sempre dentro de `ui-editor-card-flow` (diretórios hierárquicos por escopo). */
    editorVariant?: "alwaysShowForm";
    editorForm: ReactNode;
};

type ShellEmptyWhenNoContextProps = LayoutPropsWithoutEditorBody & {
    editorVariant: "emptyWhenNoContext";
    hasEditorContext: boolean;
    emptyEditorMessage: ReactNode;
    editorForm: ReactNode;
};

export type ConfigurationDirectoryEditorShellProps =
    | ShellAlwaysShowFormProps
    | ShellEmptyWhenNoContextProps;

/**
 * Segunda camada acima do layout: política do corpo do editor (fluxo de cards vs painel vazio).
 * Comportamento de negócio, fetch e aside permanecem no cliente.
 *
 * `emptyWhenNoContext`: útil quando o shell deve esconder o formulário inteiro sem contexto (ex.: certos fluxos de registro único).
 * Diretórios com atalho **Novo** (`…=new`) devem usar o padrão **`alwaysShowForm`** e tratar vazio no JSX do editor, para o modo criação aparecer como nos outros painéis (escopos, membros).
 */
export function ConfigurationDirectoryEditorShell(
    props: ConfigurationDirectoryEditorShellProps
) {
    const {
        editorForm,
        headerTitle,
        headerDescription,
        topContent,
        directoryAside,
        editorPanelRef,
        isDeletePending,
        directoryAsideEditorGrowRatio,
        history,
        footer
    } = props;

    const editorBody =
        props.editorVariant === "emptyWhenNoContext" && !props.hasEditorContext ? (
            <div className="ui-panel ui-empty-panel">{props.emptyEditorMessage}</div>
        ) : (
            <div className="ui-editor-card-flow">{editorForm}</div>
        );

    return (
        <ConfigurationDirectoryEditorLayout
            headerTitle={headerTitle}
            headerDescription={headerDescription}
            topContent={topContent}
            directoryAside={directoryAside}
            editorPanelRef={editorPanelRef}
            isDeletePending={isDeletePending}
            directoryAsideEditorGrowRatio={directoryAsideEditorGrowRatio}
            editorBody={editorBody}
            history={history}
            footer={footer}
        />
    );
}
