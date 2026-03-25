type EditorPanelFlashOverlayProps = {
    active: boolean;
};

export function EditorPanelFlashOverlay({ active }: EditorPanelFlashOverlayProps) {
    if (!active) {
        return null;
    }

    return (
        <>
            <span aria-hidden className="ui-editor-flash-ring" />
            <span aria-hidden className="ui-editor-flash-fill" />
        </>
    );
}
