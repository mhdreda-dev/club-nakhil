"use client";

import { AlertTriangle, Clock3, Home, LogIn, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { ClubLogo } from "@/components/club-logo";

export default function PendingApprovalPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const warningCode = searchParams.get("warning");
  const warningMessage =
    warningCode === "avatar-upload-failed"
      ? "Your account was created, but the profile image could not be uploaded. You can add it later from your profile after approval."
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(245,200,101,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 cn-grid-bg opacity-30"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-500/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Approval Required
          </span>
        </header>

        <section className="mx-auto my-auto w-full max-w-2xl cn-rise rounded-3xl border border-white/10 bg-club-surface/85 p-7 text-center shadow-[0_35px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-amber-300/35 bg-amber-500/15">
            <ClubLogo size={70} glow />
          </div>

          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-500/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100">
            <Clock3 className="h-3.5 w-3.5" />
            Account Pending
          </span>

          <h1 className="mt-5 font-heading text-4xl uppercase tracking-[0.05em] text-white sm:text-5xl">
            Waiting For
            <br />
            <span className="cn-text-green-gradient">Admin Approval</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm text-club-text-soft sm:text-base">
            Your member account has been created successfully and is currently under review.
            You will be able to log in as soon as an admin activates your account.
          </p>

          {email ? (
            <p className="mt-3 text-sm text-red-200">
              Registered email: <span className="font-semibold text-white">{email}</span>
            </p>
          ) : null}

          {warningMessage ? (
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warningMessage}</span>
            </div>
          ) : null}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link href="/login" className="cn-btn cn-btn-primary w-full !py-3">
              <LogIn className="h-4 w-4" />
              Back to Login
            </Link>
            <Link href="/" className="cn-btn cn-btn-ghost w-full !py-3">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-club-muted">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              What happens next
            </p>
            <ol className="mt-3 space-y-2">
              {["Admin reviews your registration request.", "Your account status changes to Active.", "You can sign in and access your member dashboard."].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-club-text-soft">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[10px] font-bold text-club-muted">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
