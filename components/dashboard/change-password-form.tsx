"use client";

import { useActionState, useEffect, useRef } from "react";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword, type SettingsActionState } from "@/app/(dashboard)/settings/actions";
import {
  SettingsPanel,
  settingsInputClass,
  settingsLabelClass,
  settingsPrimaryBtnClass,
} from "@/components/dashboard/settings-panel";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(changePassword, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "success" in state) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <SettingsPanel
        title="Security"
        subtitle="Update the password for email sign-in"
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className={settingsPrimaryBtnClass}>
              {pending ? "Updating…" : "Update password"}
            </button>
            {state && "error" in state ? (
              <p role="alert" className="text-[13px] text-[#d8695f]">
                {state.error}
              </p>
            ) : null}
            {state && "success" in state ? <p className="text-[13px] text-[#3fbf87]">Password updated.</p> : null}
          </div>
        }
      >
        <div className="grid max-w-[520px] grid-cols-1 gap-4">
          <div>
            <label htmlFor="password" className={`${settingsLabelClass} mb-2.5 block`}>
              New password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={settingsInputClass}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={`${settingsLabelClass} mb-2.5 block`}>
              Confirm new password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={8}
              className={settingsInputClass}
            />
          </div>
        </div>
      </SettingsPanel>
    </form>
  );
}
