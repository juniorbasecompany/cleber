"use client";

import { TenantDateTimePicker } from "@/component/ui/tenant-date-time-picker";

type EventFilterOption = {
  id: number;
  label: string;
};

type EventFilterPanelCopy = {
  momentFromLabel: string;
  momentToLabel: string;
  locationLabel: string;
  unityLabel: string;
  actionLabel: string;
  allLabel: string;
};

type EventFilterPanelProps = {
  locale: string;
  copy: EventFilterPanelCopy;
  filterMomentFromInput: string;
  filterMomentToInput: string;
  filterLocationId: number | null;
  filterUnityId: number | null;
  filterActionId: number | null;
  locationOptionList: EventFilterOption[];
  unityOptionList: EventFilterOption[];
  actionOptionList: EventFilterOption[];
  onFilterMomentFromChange: (value: Date | null) => void;
  onFilterMomentToChange: (value: Date | null) => void;
  onFilterLocationChange: (value: string) => void;
  onFilterUnityChange: (value: string) => void;
  onFilterActionChange: (value: string) => void;
};

export function EventFilterPanel({
  locale,
  copy,
  filterMomentFromInput,
  filterMomentToInput,
  filterLocationId,
  filterUnityId,
  filterActionId,
  locationOptionList,
  unityOptionList,
  actionOptionList,
  onFilterMomentFromChange,
  onFilterMomentToChange,
  onFilterLocationChange,
  onFilterUnityChange,
  onFilterActionChange
}: EventFilterPanelProps) {
  return (
    <section className="ui-stack-md">
      <div className="ui-history-filter-grid">
        <article className="ui-card ui-form-section ui-event-filter-card">
          <div className="ui-field">
            <label className="ui-field-label" htmlFor="event-filter-moment-from">
              {copy.momentFromLabel}
            </label>
            <TenantDateTimePicker
              id="event-filter-moment-from"
              value={filterMomentFromInput ? new Date(filterMomentFromInput) : null}
              onChange={onFilterMomentFromChange}
              locale={locale}
              periodBoundary="start"
            />
          </div>
        </article>

        <article className="ui-card ui-form-section ui-event-filter-card">
          <div className="ui-field">
            <label className="ui-field-label" htmlFor="event-filter-moment-to">
              {copy.momentToLabel}
            </label>
            <TenantDateTimePicker
              id="event-filter-moment-to"
              value={filterMomentToInput ? new Date(filterMomentToInput) : null}
              onChange={onFilterMomentToChange}
              locale={locale}
              periodBoundary="end"
            />
          </div>
        </article>

        <article className="ui-card ui-form-section ui-event-filter-card">
          <div className="ui-field">
            <label className="ui-field-label" htmlFor="event-filter-location">
              {copy.locationLabel}
            </label>
            <select
              id="event-filter-location"
              className="ui-input ui-input-select"
              value={filterLocationId == null ? "" : String(filterLocationId)}
              onChange={(event) => onFilterLocationChange(event.target.value)}
            >
              <option value="" aria-label={copy.allLabel}></option>
              {locationOptionList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </article>

        <article className="ui-card ui-form-section ui-event-filter-card">
          <div className="ui-field">
            <label className="ui-field-label" htmlFor="event-filter-unity">
              {copy.unityLabel}
            </label>
            <select
              id="event-filter-unity"
              className="ui-input ui-input-select"
              value={filterUnityId == null ? "" : String(filterUnityId)}
              onChange={(event) => onFilterUnityChange(event.target.value)}
            >
              <option value="" aria-label={copy.allLabel}></option>
              {unityOptionList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </article>

        <article className="ui-card ui-form-section ui-event-filter-card">
          <div className="ui-field">
            <label className="ui-field-label" htmlFor="event-filter-action">
              {copy.actionLabel}
            </label>
            <select
              id="event-filter-action"
              className="ui-input ui-input-select"
              value={filterActionId == null ? "" : String(filterActionId)}
              onChange={(event) => onFilterActionChange(event.target.value)}
            >
              <option value="" aria-label={copy.allLabel}></option>
              {actionOptionList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </article>
      </div>
    </section>
  );
}
