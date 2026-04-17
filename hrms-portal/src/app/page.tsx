import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Database, LockKeyhole, PanelsTopLeft } from "lucide-react";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/workspace");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#f4f8fb_0%,_#eef3f8_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[36px] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Core Vision
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight lg:text-5xl">
            HRMS portal foundation with a real backend slice now in progress.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            This workspace now supports a seeded PostgreSQL database, credential sign-in,
            tenant-aware data models, and API routes for employees, leave, approvals, and
            attendance.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              href="/sign-in"
            >
              Open sign-in
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              href="/preview"
            >
              Open UI preview
              <PanelsTopLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4">
          <article className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Backend stack
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  PostgreSQL, Prisma, Auth.js, Zod
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              The developer preview is no longer frontend-only. This slice adds a real
              relational schema, seeded credentials, and API persistence groundwork.
            </p>
          </article>

          <article className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Browser flow
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Sign in, review data, keep the preview
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Use the authenticated workspace for seeded server-backed data, or keep using the
              separate preview route for UI-only workflow exploration while backend integration
              continues.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
