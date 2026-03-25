import type { CSSProperties } from "react";

const DEFAULT_FLAT_TONE_STYLE: CSSProperties = {
    "--ui-location-depth": "0",
    "--ui-location-tone-light-share": "100%",
    "--ui-location-tone-dark-share": "0%"
} as CSSProperties;

type DirectoryCreateToolbarButtonProps = {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    /** Estilo de tom da borda (ex.: árvore de locais); padrão = lista plana. */
    toneStyle?: CSSProperties;
};

export function DirectoryCreateToolbarButton({
    label,
    active,
    disabled,
    onClick,
    toneStyle = DEFAULT_FLAT_TONE_STYLE
}: DirectoryCreateToolbarButtonProps) {
    return (
        <div className="ui-location-nest-list-toolbar">
            <button
                type="button"
                className="ui-location-nest-create"
                style={toneStyle}
                aria-label={label}
                title={label}
                data-active={active ? "true" : undefined}
                onClick={onClick}
                disabled={disabled}
            >
                <span aria-hidden>{label}</span>
            </button>
        </div>
    );
}
