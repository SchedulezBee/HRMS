"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      type="button"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
