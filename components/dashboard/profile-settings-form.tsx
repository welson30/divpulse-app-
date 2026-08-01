"use client";

import { useActionState, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type SettingsActionState } from "@/app/(dashboard)/settings/actions";

type ProfileSettingsFormProps = {
  email: string;
  emailVerified: boolean;
  displayName: string;
  defaultBroker: string;
};

const DEFAULTS = { displayName: "", defaultBroker: "" };

export function ProfileSettingsForm({ email, emailVerified, displayName, defaultBroker }: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(updateProfile, null);
  const nameRef = useRef<HTMLInputElement>(null);
  const brokerRef = useRef<HTMLInputElement>(null);

  function resetToDefaults() {
    if (nameRef.current) nameRef.current.value = DEFAULTS.displayName;
    if (brokerRef.current) brokerRef.current.value = DEFAULTS.defaultBroker;
  }

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Input id="email" value={email} disabled className="h-11 px-3.5 pr-28 text-[15px]" />
          {emailVerified ? (
            <span className="absolute top-1/2 right-3.5 flex -translate-y-1/2 items-center gap-1 font-mono text-xs font-medium text-green-500">
              <Check className="size-3.5" aria-hidden />
              Verified
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          ref={nameRef}
          defaultValue={displayName}
          placeholder="How should we address you?"
          maxLength={80}
          className="h-11 px-3.5 text-[15px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defaultBroker">
          Default broker <span className="font-normal text-text-secondary">(optional)</span>
        </Label>
        <Input
          id="defaultBroker"
          name="defaultBroker"
          ref={brokerRef}
          defaultValue={defaultBroker}
          placeholder="Fidelity"
          className="h-11 px-3.5 text-[15px]"
        />
        <span className="text-xs text-text-secondary">Pre-fills the broker field when you add a holding</span>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-green-500">Saved.</p> : null}

      <div className="flex items-center gap-sp-3">
        <Button type="submit" disabled={pending} className="h-10 px-5 text-[13px]">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <button
          type="button"
          onClick={resetToDefaults}
          className="font-sans text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Reset to defaults
        </button>
      </div>
    </form>
  );
}
