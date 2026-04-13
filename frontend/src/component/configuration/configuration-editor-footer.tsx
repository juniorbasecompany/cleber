import Link from "next/link";
import type { ReactNode } from "react";

export type ConfigurationEditorFooterProps = {
    configurationPath?: string;
    cancelLabel?: string;
    discardConfirm: string;
    isDirty: boolean;
    /** Texto simples ou conteúdo rico (por exemplo mensagens com formatação). */
    footerErrorMessage: ReactNode | null;
    footerNoticeMessage?: string | null;
    footerNoticeTone?: "success" | "attention";
    onSave: () => void;
    saveDisabled: boolean;
    saveLabel: string;
    savingLabel: string;
    isSaving: boolean;
    startContent?: ReactNode;
    endContent?: ReactNode;
    dangerAction?: ReactNode;
};

export function ConfigurationEditorFooter({
    configurationPath,
    cancelLabel,
    footerErrorMessage,
    footerNoticeMessage = null,
    footerNoticeTone = "success",
    onSave,
    saveDisabled,
    saveLabel,
    savingLabel,
    isSaving,
    startContent,
    endContent,
    dangerAction
}: ConfigurationEditorFooterProps) {
    return (
        <div className="ui-action-footer">
            <div className="ui-action-footer-start">
                {configurationPath && cancelLabel ? (
                    <Link
                        href={configurationPath}
                        className="ui-button-secondary"
                    >
                        {cancelLabel}
                    </Link>
                ) : null}
                {startContent}
            </div>
            <div className="ui-action-footer-feedback">
                {footerErrorMessage ? (
                    <div
                        className="ui-notice-danger ui-notice-block ui-status-copy"
                        style={{ whiteSpace: "pre-line" }}
                    >
                        {footerErrorMessage}
                    </div>
                ) : footerNoticeMessage ? (
                    <div
                        className={
                            footerNoticeTone === "attention"
                                ? "ui-notice-attention ui-notice-block ui-status-copy"
                                : "ui-tone-positive ui-notice-block ui-status-copy"
                        }
                        style={{ whiteSpace: "pre-line" }}
                    >
                        {footerNoticeMessage}
                    </div>
                ) : null}
            </div>
            <div className="ui-action-footer-end">
                {endContent}
                {dangerAction}
                <button
                    type="button"
                    className="ui-button-primary"
                    onClick={onSave}
                    disabled={saveDisabled}
                    aria-busy={isSaving}
                >
                    {saveLabel}
                    {isSaving ? (
                        <span className="ui-sr-only" role="status">
                            {savingLabel}
                        </span>
                    ) : null}
                </button>
            </div>
        </div>
    );
}
