"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { updateCalendarPrivacyMode, type SettingsActionState } from "@/app/(dashboard)/settings/actions";

type CalendarPrivacyFormProps = {
  calendarPrivacyMode: string;
};

export function CalendarPrivacyForm({ calendarPrivacyMode }: CalendarPrivacyFormProps) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(updateCalendarPrivacyMode, null);

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="calendarPrivacyMode">Calendar detail</Label>
        <SelectNative id="calendarPrivacyMode" name="calendarPrivacyMode" defaultValue={calendarPrivacyMode} className="max-w-70">
          <option value="full">Ticker + amount</option>
          <option value="amount_only">Amount only</option>
          <option value="ticker_only">Ticker only</option>
        </SelectNative>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-green-500">Saved.</p> : null}

      <Button type="submit" disabled={pending} className="h-10 self-start px-5 text-[13px]">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
