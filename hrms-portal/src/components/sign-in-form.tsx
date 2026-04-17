"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

const demoAccounts = [
  { role: "Tenant Admin", email: "tenant.admin@corevision.local" },
  { role: "HR Admin", email: "alya.rahman@corevision.local" },
  { role: "Manager", email: "daniel.tan@corevision.local" },
  { role: "Employee", email: "marcus.lee@corevision.local" },
] as const;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/workspace";
  const [email, setEmail] = useState<string>(demoAccounts[1].email);
  const [password, setPassword] = useState<string>("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("Sign-in failed. Check the seeded credentials or database setup.");
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="rounded-[28px] bg-slate-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
          Sign in
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Backend workspace access</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Use one of the seeded accounts below. All demo accounts share the same development
          password for this local environment.
        </p>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {isSubmitting ? "Signing in" : "Sign in to workspace"}
        </button>
      </form>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Seeded accounts
        </p>
        <div className="mt-3 grid gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-emerald-400 hover:bg-emerald-50"
              onClick={() => setEmail(account.email)}
              type="button"
            >
              <span className="font-medium text-slate-900">{account.role}</span>
              <span className="text-slate-500">{account.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Shared development password: <span className="font-semibold text-slate-900">Password123!</span>
        </p>
      </div>
    </div>
  );
}
