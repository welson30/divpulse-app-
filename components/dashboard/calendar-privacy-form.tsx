"use client";

import { useActionState } from "react";
import { SelectNative } from "@/components/ui/select-native";
import { updateCalendarPrivacyMode, type SettingsActionState } from "@/app/(dashboard)/settings/actions";
import {
  SettingsPanel,
  settingsInputClass,
  settingsLabelClass,
  settingsPrimaryBtnClass,
} from "@/components/dashboard/settings-panel";

type CalendarPrivacyFormProps = {
  calendarPrivacyMode: string;
};

export function CalendarPrivacyForm({ calendarPrivacyMode }: CalendarPrivacyFormProps) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(updateCalendarPrivacyMode, null);

  return (
    <form action={formAction}>
      <SettingsPanel
        title="Calendar privacy"
        subtitle="What the dividend calendar shows — useful when recording without revealing holdings"
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className={settingsPrimaryBtnClass}>
              {pending ? "Saving…" : "Save changes"}
            </button>
            {state && "error" in state ? (
              <p role="alert" className="text-[13px] text-[#d8695f]">
                {state.error}
              </p>
            ) : null}
            {state && "success" in state ? <p className="text-[13px] text-[#3fbf87]">Saved.</p> : null}
          </div>
        }
      >
        <div className="max-w-[520px]">
          <label htmlFor="calendarPrivacyMode" className={`${settingsLabelClass} mb-2.5 block`}>
            Calendar detail
          </label>
          <SelectNative
            id="calendarPrivacyMode"
            name="calendarPrivacyMode"
            defaultValue={calendarPrivacyMode}
            className={settingsInputClass}
          >
            <option value="full">Ticker + amount</option>
            <option value="amount_only">Amount only</option>
            <option value="ticker_only">Ticker only</option>
          </SelectNative>
        </div>
      </SettingsPanel>
    </form>
  );
}
