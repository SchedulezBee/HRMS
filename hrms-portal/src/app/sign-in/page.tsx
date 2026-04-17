import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, DatabaseZap } from "lucide-react";
import { auth } from "@/auth";
import { SignInForm } from "@/components/sign-in-form";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/workspace");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_#f4f8fb_0%,_#eef3f8_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-stretch">
        <section className="flex flex-1 flex-col justify-between rounded-[36px] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] lg:p-10">
          <div>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              href="/"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to entry
            </Link>
            <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950">
              <DatabaseZap className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Sign in to the seeded HRMS backend workspace.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              This route is meant for the real backend slice, not just the UI preview. Once you
              sign in, the workspace reads live data from the local PostgreSQL development
              database.
            </p>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Included in this slice
            </p>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
              <li>Server-side auth with role and tenant claims</li>
              <li>Prisma schema for employees, leave, attendance, and audit logs</li>
              <li>Seeded dev users for quick browser testing</li>
              <li>API routes with debug-friendly error responses</li>
            </ul>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center">
          <SignInForm />
        </section>
      </div>
    </main>
  );
}
