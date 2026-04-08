"use client";

import type { ReactNode } from "react";

type DirectoryFilterOption = {
  value: string;
  label: string;
};

type DirectoryFilterPanelProps = {
  children: ReactNode;
};

type DirectoryFilterCardProps = {
  children: ReactNode;
};

type DirectoryFilterTextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type DirectoryFilterSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  optionList: DirectoryFilterOption[];
  onChange: (value: string) => void;
  allAriaLabel?: string;
};

type DirectoryFilterMultiSelectFieldProps = {
  id: string;
  label: string;
  optionList: DirectoryFilterOption[];
  allIsSelected: boolean;
  selectedValueList: string[];
  onChange: (next: {
    allIsSelected: boolean;
    selectedValueList: string[];
  }) => void;
  allLabel?: string;
};

export function DirectoryFilterPanel({ children }: DirectoryFilterPanelProps) {
  return (
    <section className="ui-panel ui-panel-body ui-panel-filter">
      <div className="ui-history-filter-grid">{children}</div>
    </section>
  );
}

export function DirectoryFilterCard({ children }: DirectoryFilterCardProps) {
  return <article className="ui-card ui-form-section ui-event-filter-card">{children}</article>;
}

export function DirectoryFilterTextField({
  id,
  label,
  value,
  onChange
}: DirectoryFilterTextFieldProps) {
  return (
    <div className="ui-field">
      <label className="ui-field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="ui-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
    </div>
  );
}

export function DirectoryFilterSelectField({
  id,
  label,
  value,
  optionList,
  onChange,
  allAriaLabel
}: DirectoryFilterSelectFieldProps) {
  return (
    <div className="ui-field">
      <label className="ui-field-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="ui-input ui-input-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" aria-label={allAriaLabel ?? ""}></option>
        {optionList.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DirectoryFilterMultiSelectField({
  id,
  label,
  optionList,
  allIsSelected,
  selectedValueList,
  onChange,
  allLabel,
}: DirectoryFilterMultiSelectFieldProps) {
  const sortedOptionList = [...optionList].sort((left, right) =>
    left.label.localeCompare(right.label, "pt-BR")
  );

  function handleToggleAll() {
    onChange({
      allIsSelected: !allIsSelected,
      selectedValueList: []
    });
  }

  function handleToggleValue(value: string) {
    if (allIsSelected) {
      onChange({
        allIsSelected: false,
        selectedValueList: [value]
      });
      return;
    }

    const nextSelectedValueList = selectedValueList.includes(value)
      ? selectedValueList.filter((item) => item !== value)
      : [...selectedValueList, value];

    onChange({
      allIsSelected: false,
      selectedValueList: nextSelectedValueList
    });
  }

  return (
    <div className="ui-field">
      <p className="ui-field-label" id={`${id}-label`}>
        {label}
      </p>
      <div className="ui-filter-chip-list" role="group" aria-labelledby={`${id}-label`}>
        <button
          type="button"
          className="ui-filter-chip"
          data-selected={allIsSelected ? "true" : undefined}
          onClick={handleToggleAll}
        >
          <span className="ui-filter-chip-check" aria-hidden data-selected={allIsSelected ? "true" : undefined}>
            {allIsSelected ? "✓" : ""}
          </span>
          <span className="ui-filter-chip-label">{allLabel ?? ""}</span>
        </button>
        {sortedOptionList.map((item) => {
          const isSelected = selectedValueList.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              className="ui-filter-chip"
              data-selected={isSelected ? "true" : undefined}
              onClick={() => handleToggleValue(item.value)}
            >
              <span className="ui-filter-chip-check" aria-hidden data-selected={isSelected ? "true" : undefined}>
                {isSelected ? "✓" : ""}
              </span>
              <span className="ui-filter-chip-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
