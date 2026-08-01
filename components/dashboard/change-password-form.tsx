"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword, type SettingsActionState } from "@/app/(dashboard)/settings/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(changePassword, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clears both fields on success — leaving the old password visible in the
  // inputs after it's already been changed would just invite a mistaken
  // re-submit of a password that's no longer valid.
  useEffect(() => {
    if (state && "success" in state) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-sm flex-col gap-sp-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} className="h-11 px-3.5 text-[15px]" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 px-3.5 text-[15px]"
        />
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-green-500">Password updated.</p> : null}

      <Button type="submit" disabled={pending} className="h-10 self-start px-5 text-[13px]">
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
