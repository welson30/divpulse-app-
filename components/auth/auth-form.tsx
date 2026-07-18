"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/marketing/google-icon";
import { signInWithGoogle, type AuthActionState } from "@/app/(auth)/actions";

type AuthFormProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  redirectTo?: string;
};

export function AuthForm({ action, submitLabel, redirectTo }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, null);

  return (
    <div className="flex flex-col gap-sp-3">
      <form action={formAction} className="flex flex-col gap-sp-3">
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-11 px-3.5 text-[15px]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            className="h-11 px-3.5 text-[15px]"
          />
        </div>

        {state?.error ? (
          <p role="alert" className="text-sm text-red-500">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="h-11 text-[15px]">
          {pending ? "Please wait…" : submitLabel}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px flex-1 bg-border-subtle" />
        <span className="font-mono text-xs text-text-secondary">or</span>
        <span aria-hidden className="h-px flex-1 bg-border-subtle" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="h-11 w-full gap-2 text-[15px]">
          <GoogleIcon className="size-[18px]" />
          Continue with Google
        </Button>
      </form>
    </div>
  );
}
