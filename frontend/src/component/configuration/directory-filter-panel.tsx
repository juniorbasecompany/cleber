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

export function DirectoryFilterPanel({ children }: DirectoryFilterPanelProps) {
  return (
    <section className="ui-stack-md">
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
