import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

type ConfigurationEditorFooterProps = {
    configurationPath: string;
    cancelLabel: string;
    discardConfirm: string;
    isDirty: boolean;
    footerErrorMessage: string | null;
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
                    <div className="ui-notice-danger ui-notice-block ui-status-copy">
                        {footerErrorMessage}
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
