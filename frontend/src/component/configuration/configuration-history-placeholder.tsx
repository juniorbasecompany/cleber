import { HistoryIcon } from "@/component/ui/ui-icons";

type ConfigurationHistoryPlaceholderProps = {
    headingId?: string;
    title: string;
    description: string;
};

export function ConfigurationHistoryPlaceholder({
    headingId,
    title,
    description
}: ConfigurationHistoryPlaceholderProps) {
    return (
        <section
            className="ui-card ui-card-coming-soon ui-panel-body-compact"
            aria-labelledby={headingId}
        >
            <div className="ui-section-header">
                <span className="ui-icon-badge ui-icon-badge-construction">
                    <HistoryIcon className="ui-icon" />
                </span>
                <div className="ui-section-copy">
                    <h2
                        id={headingId}
                        className="ui-header-title ui-title-section"
                    >
                        {title}
                    </h2>
                    <p className="ui-copy-body">{description}</p>
                </div>
            </div>
        </section>
    );
}
