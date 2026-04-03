/**
 * Atalho "Novo" / "Nova" canônico nos painéis diretório + editor de Configuração.
 * Mesmas regras que o «+» de novo filho (`ui-location-nest-create`): `vertical-semantic-component.css`;
 * referência cromática `--color-editor-vertical-border` e tokens `--color-editor-create-button-*` em `base.css`.
 */
export type ConfigurationDirectoryCreateButtonProps = {
    /** Texto curto conforme o gênero do substantivo cadastrado (ex.: Novo / Nova). */
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    /**
     * Quando falso, devolve só o botão (para compor a linha com o switch de filtros).
     * Padrão: envolve em `ui-configuration-directory-create-toolbar`.
     */
    wrapInToolbar?: boolean;
};

export function ConfigurationDirectoryCreateButton({
    label,
    active,
    disabled,
    onClick,
    wrapInToolbar = true
}: ConfigurationDirectoryCreateButtonProps) {
    const button = (
        <button
            type="button"
            className="ui-configuration-directory-create-button"
            aria-label={label}
            title={label}
            data-active={active ? "true" : undefined}
            onClick={onClick}
            disabled={disabled}
        >
            <span aria-hidden>{label}</span>
        </button>
    );
    if (!wrapInToolbar) {
        return button;
    }
    return <div className="ui-configuration-directory-create-toolbar">{button}</div>;
}
