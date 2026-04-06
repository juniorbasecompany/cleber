"use client";

type ConfigurationPanelVisibilitySwitchProps = {
  checked: boolean;
  ariaLabel: string;
  label: string;
  onToggle: () => void;
};

export function ConfigurationPanelVisibilitySwitch({
  checked,
  ariaLabel,
  label,
  onToggle
}: ConfigurationPanelVisibilitySwitchProps) {
  return (
    <div className="ui-history-panel-visibility">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        className="ui-history-visibility-switch"
        onClick={onToggle}
      >
        <span
          className="ui-history-visibility-switch-track"
          data-on={checked ? "true" : undefined}
        >
          <span className="ui-history-visibility-switch-thumb" aria-hidden />
        </span>
      </button>
      <span className="ui-history-panel-visibility-label">{label}</span>
    </div>
  );
}
