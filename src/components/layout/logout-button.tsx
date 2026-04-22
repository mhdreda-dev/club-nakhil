"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-club-text-soft transition hover:border-rose-300/40 hover:bg-rose-500/10 hover:text-rose-100"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4 transition group-hover:-translate-x-0.5" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
