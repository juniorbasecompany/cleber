"use client";

import { TenantDateTimePicker } from "@/component/ui/tenant-date-time-picker";
import {
  DirectoryFilterCard,
  DirectoryFilterPanel,
  DirectoryFilterSelectField
} from "@/component/configuration/directory-filter-panel";

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
    <DirectoryFilterPanel>
      <DirectoryFilterCard>
        <div className="ui-field">
          <label className="ui-field-label" htmlFor="event-filter-moment-from">
            {copy.momentFromLabel}
          </label>
          <TenantDateTimePicker
            id="event-filter-moment-from"
            value={filterMomentFromInput ? new Date(filterMomentFromInput) : null}
            onChange={onFilterMomentFromChange}
            locale={locale}
            hidePlaceholder
            periodBoundary="start"
          />
        </div>
      </DirectoryFilterCard>

      <DirectoryFilterCard>
        <div className="ui-field">
          <label className="ui-field-label" htmlFor="event-filter-moment-to">
            {copy.momentToLabel}
          </label>
          <TenantDateTimePicker
            id="event-filter-moment-to"
            value={filterMomentToInput ? new Date(filterMomentToInput) : null}
            onChange={onFilterMomentToChange}
            locale={locale}
            hidePlaceholder
            periodBoundary="end"
          />
        </div>
      </DirectoryFilterCard>

      <DirectoryFilterCard>
        <DirectoryFilterSelectField
          id="event-filter-location"
          label={copy.locationLabel}
          value={filterLocationId == null ? "" : String(filterLocationId)}
          onChange={onFilterLocationChange}
          allAriaLabel={copy.allLabel}
          optionList={locationOptionList.map((item) => ({
            value: String(item.id),
            label: item.label
          }))}
        />
      </DirectoryFilterCard>

      <DirectoryFilterCard>
        <DirectoryFilterSelectField
          id="event-filter-unity"
          label={copy.unityLabel}
          value={filterUnityId == null ? "" : String(filterUnityId)}
          onChange={onFilterUnityChange}
          allAriaLabel={copy.allLabel}
          optionList={unityOptionList.map((item) => ({
            value: String(item.id),
            label: item.label
          }))}
        />
      </DirectoryFilterCard>

      <DirectoryFilterCard>
        <DirectoryFilterSelectField
          id="event-filter-action"
          label={copy.actionLabel}
          value={filterActionId == null ? "" : String(filterActionId)}
          onChange={onFilterActionChange}
          allAriaLabel={copy.allLabel}
          optionList={actionOptionList.map((item) => ({
            value: String(item.id),
            label: item.label
          }))}
        />
      </DirectoryFilterCard>
    </DirectoryFilterPanel>
  );
}
