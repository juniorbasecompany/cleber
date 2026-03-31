/** Mapeia locale da app (`pt-BR`, `en-US`, …) para `label.lang` no backend (`pt-BR`, `en`, `es`). */
export function mapAppLocaleToLabelLang(locale: string): "pt-BR" | "en" | "es" {
    if (locale === "pt-BR") {
        return "pt-BR";
    }
    if (locale === "en-US") {
        return "en";
    }
    if (locale === "es-ES") {
        return "es";
    }
    return "pt-BR";
}

export type LabelLang = ReturnType<typeof mapAppLocaleToLabelLang>;
