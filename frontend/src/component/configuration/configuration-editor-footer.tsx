import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

export type ConfigurationEditorFooterProps = {
    configurationPath: string;
    cancelLabel: string;
    discardConfirm: string;
    isDirty: boolean;
    footerErrorMessage: string | null;
    footerNoticeMessage?: string | null;
    footerNoticeTone?: "success" | "attention";
    onSave: () => void;
    saveDisabled: boolean;
    saveLabel: string;
    savingLabel: string;
    isSaving: boolean;
    dangerAction?: ReactNode;
};

export function ConfigurationEditorFooter({
    configurationPath,
    cancelLabel,
    discardConfirm,
    isDirty,
    footerErrorMessage,
    footerNoticeMessage = null,
    footerNoticeTone = "success",
    onSave,
    saveDisabled,
    saveLabel,
    savingLabel,
    isSaving,
    dangerAction
}: ConfigurationEditorFooterProps) {
    const handleBack = (event: MouseEvent<HTMLAnchorElement>) => {
        if (isDirty && !window.confirm(discardConfirm)) {
            event.preventDefault();
        }
    };

    return (
        <div className="ui-action-footer">
            <Link
                href={configurationPath}
                className="ui-button-secondary"
                onClick={handleBack}
            >
                {cancelLabel}
            </Link>
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
                {dangerAction}
                <button
                    type="button"
                    className="ui-button-primary"
                    onClick={onSave}
                    disabled={saveDisabled}
                >
                    {isSaving ? savingLabel : saveLabel}
                </button>
            </div>
        </div>
    );
}
