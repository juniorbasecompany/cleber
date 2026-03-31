"use client";

import { TrashIcon } from "@/component/ui/ui-icons";

export type TrashIconButtonProps = {
    /** Rótulo acessível (ação atual: apagar, desmarcar, marcar para exclusão, etc.). */
    ariaLabel: string;
    disabled?: boolean;
    /** Estado “marcado para exclusão” (estilo vermelho). */
    marked?: boolean;
    onClick: () => void;
    className?: string;
};

/**
 * Botão só com ícone de lixeira: cinza no estado normal, vermelho quando `marked`.
 * Estilos do botão: `.ui-trash-icon-button` em vertical-semantic-component.css.
 * Superfície “exclusão pendente” (painel editor, linhas de fórmula): `--ui-delete-pending-surface` em trash-icon-button.css.
 */
export function TrashIconButton({
    ariaLabel,
    disabled,
    marked,
    onClick,
    className
}: TrashIconButtonProps) {
    return (
        <button
            type="button"
            className={[
                "ui-trash-icon-button",
                marked ? "ui-trash-icon-button--marked" : "",
                className ?? ""
            ]
                .filter(Boolean)
                .join(" ")}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
        >
            <TrashIcon />
        </button>
    );
}
