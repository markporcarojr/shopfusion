"use client";

import { SignIn, useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_EMAIL = "markporcarojr+demo@gmail.com";
const DEMO_PASSWORD = "Thisisthedemo1!";

export default function SignInPage() {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function demoLogin() {
    if (!signIn) return;
    setLoading(true);
    setError(null);
    try {
      await signIn.create({ identifier: DEMO_EMAIL });
      const res = await signIn.password({ password: DEMO_PASSWORD });

      if (res?.error) {
        setError("Demo sign-in failed.");
        setLoading(false);
        return;
      }

      if (signIn.status === "complete") {
        await setActive({ session: signIn.createdSessionId });
        router.push("/dashboard");
      } else {
        setError(`Unexpected status: ${signIn.status}`);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Demo sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-background">
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-in"
      />

      <div className="w-full max-w-100 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={demoLogin}
          disabled={loading}
          className="w-full rounded-md bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition-colors"
        >
          {loading ? "Signing in…" : "Explore as Demo User"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          No account needed — one click into a populated demo shop.
        </p>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}
