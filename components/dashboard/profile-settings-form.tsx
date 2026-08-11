"use client";

import { useActionState, useMemo } from "react";
import { updateProfile, type SettingsActionState } from "@/app/(dashboard)/settings/actions";
import {
  SettingsPanel,
  settingsInputClass,
  settingsLabelClass,
  settingsPrimaryBtnClass,
} from "@/components/dashboard/settings-panel";

type ProfileSettingsFormProps = {
  email: string;
  displayName: string;
  defaultBroker: string;
  currency: string;
};

export function ProfileSettingsForm({ email, displayName, defaultBroker, currency }: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(updateProfile, null);
  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  return (
    <form action={formAction}>
      <SettingsPanel
        title="Profile"
        subtitle="Your personal information"
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
        <div className="grid grid-cols-1 gap-4 min-[700px]:grid-cols-2">
          <Field label="Full name" htmlFor="displayName">
            <input
              id="displayName"
              name="displayName"
              defaultValue={displayName}
              placeholder="How should we address you?"
              maxLength={80}
              className={settingsInputClass}
            />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" value={email} disabled readOnly className={settingsInputClass} />
          </Field>
          <Field label="Timezone" htmlFor="timezone" hint="Detected from this device. Calendar dates are stored in UTC.">
            <input id="timezone" value={timezone} disabled readOnly className={settingsInputClass} />
          </Field>
          <Field label="Base currency" htmlFor="currency" hint="Amounts are shown in USD. Conversion isn't supported.">
            <input id="currency" value={currency || "USD"} disabled readOnly className={settingsInputClass} />
          </Field>
          <Field
            label="Default broker"
            htmlFor="defaultBroker"
            hint="Pre-fills the broker field when you add a holding."
            className="min-[700px]:col-span-2"
          >
            <input
              id="defaultBroker"
              name="defaultBroker"
              defaultValue={defaultBroker}
              placeholder="Fidelity"
              className={settingsInputClass}
            />
          </Field>
        </div>
      </SettingsPanel>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={`${settingsLabelClass} mb-2.5 block`}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-[12px] leading-[19.8px] text-[#6c737f]">{hint}</p> : null}
    </div>
  );
}
