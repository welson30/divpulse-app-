"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { updateProfile, type SettingsActionState } from "@/app/(dashboard)/settings/actions";

type ProfileSettingsFormProps = {
  email: string;
  displayName: string | null;
  currency: string;
  locale: string;
};

export function ProfileSettingsForm({ email, displayName, currency, locale }: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(updateProfile, null);

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="h-11 px-3.5 text-[15px]" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName ?? ""}
          placeholder="Alex"
          className="h-11 px-3.5 text-[15px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-sp-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <SelectNative id="currency" name="currency" defaultValue={currency}>
            <option value="USD">USD ($)</option>
            <option value="BRL">BRL (R$)</option>
            <option value="MXN">MXN ($)</option>
          </SelectNative>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="locale">Language</Label>
          <SelectNative id="locale" name="locale" defaultValue={locale}>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
          </SelectNative>
        </div>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-green-500">Saved.</p> : null}

      <Button type="submit" disabled={pending} className="h-11 self-start text-[15px]">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
