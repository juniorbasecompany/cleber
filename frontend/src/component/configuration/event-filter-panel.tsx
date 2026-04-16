"use client";

import { HierarchyDropdownField } from "@/component/configuration/hierarchy-dropdown-field";
import {
  DirectoryFilterCard,
  DirectoryFilterPanel,
  DirectoryFilterSelectField
} from "@/component/configuration/directory-filter-panel";
import type { TenantItemRecord, TenantLocationRecord } from "@/lib/auth/types";

type EventFilterOption = {
  id: number;
  label: string;
};

type EventFilterPanelCopy = {
  ageFromLabel: string;
  ageToLabel: string;
  locationLabel: string;
  itemLabel: string;
  actionLabel: string;
  allLabel: string;
  allAriaLabel: string;
  confirmLabel: string;
};

type EventFilterPanelProps = {
  locale: string;
  /** Quando false, omite o filtro por faixa de idade. */
  showAgeRange?: boolean;
  copy: EventFilterPanelCopy;
  filterAgeFromInput: string;
  filterAgeToInput: string;
  filterLocationIdList: number[];
  filterItemIdList: number[];
  filterActionId: number | null;
  locationItemList: TenantLocationRecord[];
  itemHierarchyList: TenantItemRecord[];
  actionOptionList: EventFilterOption[];
  onFilterAgeFromChange: (value: string) => void;
  onFilterAgeToChange: (value: string) => void;
  onFilterLocationChange: (valueList: number[]) => void;
  onFilterItemChange: (valueList: number[]) => void;
  onFilterActionChange: (value: string) => void;
};

export function EventFilterPanel({
  locale,
  showAgeRange = true,
  copy,
  filterAgeFromInput,
  filterAgeToInput,
  filterLocationIdList,
  filterItemIdList,
  filterActionId,
  locationItemList,
  itemHierarchyList,
  actionOptionList,
  onFilterAgeFromChange,
  onFilterAgeToChange,
  onFilterLocationChange,
  onFilterItemChange,
  onFilterActionChange
}: EventFilterPanelProps) {
  void locale;
  return (
    <DirectoryFilterPanel>
      {showAgeRange ? (
        <>
          <DirectoryFilterCard>
            <div className="ui-field">
              <label className="ui-field-label" htmlFor="event-filter-age-from">
                {copy.ageFromLabel}
              </label>
              <input
                id="event-filter-age-from"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className="ui-input"
                value={filterAgeFromInput}
                onChange={(event) => {
                  onFilterAgeFromChange(event.target.value);
                }}
                aria-label={copy.ageFromLabel}
              />
            </div>
          </DirectoryFilterCard>

          <DirectoryFilterCard>
            <div className="ui-field">
              <label className="ui-field-label" htmlFor="event-filter-age-to">
                {copy.ageToLabel}
              </label>
              <input
                id="event-filter-age-to"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className="ui-input"
                value={filterAgeToInput}
                onChange={(event) => {
                  onFilterAgeToChange(event.target.value);
                }}
                aria-label={copy.ageToLabel}
              />
            </div>
          </DirectoryFilterCard>
        </>
      ) : null}

      <DirectoryFilterCard>
        <HierarchyDropdownField
          id="event-filter-location"
          label={copy.locationLabel}
          itemList={locationItemList}
          selectedValueList={filterLocationIdList}
          onChange={onFilterLocationChange}
          getParentId={(item) => item.parent_location_id ?? null}
          allLabel={copy.allLabel}
          confirmLabel={copy.confirmLabel}
        />
      </DirectoryFilterCard>

      <DirectoryFilterCard>
        <HierarchyDropdownField
          id="event-filter-item"
          label={copy.itemLabel}
          itemList={itemHierarchyList}
          selectedValueList={filterItemIdList}
          onChange={onFilterItemChange}
          getParentId={(row) => row.parent_item_id ?? null}
          allLabel={copy.allLabel}
          confirmLabel={copy.confirmLabel}
        />
      </DirectoryFilterCard>

      <DirectoryFilterCard>
        <DirectoryFilterSelectField
          id="event-filter-action"
          label={copy.actionLabel}
          value={filterActionId == null ? "" : String(filterActionId)}
          onChange={onFilterActionChange}
          allAriaLabel={copy.allAriaLabel}
          optionList={actionOptionList.map((item) => ({
            value: String(item.id),
            label: item.label
          }))}
        />
      </DirectoryFilterCard>
    </DirectoryFilterPanel>
  );
}
