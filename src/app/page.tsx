import {
  ArrowRight,
  Flame,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { ClubLogo } from "@/components/club-logo";
import { getAuthSession } from "@/lib/get-session";

const features = [
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: "Coach & Member Dashboards",
    text: "Role-based workspaces with focused tools to run every session with intent.",
    tone: "emerald" as const,
  },
  {
    icon: <QrCode className="h-5 w-5" />,
    title: "QR Attendance",
    text: "Instant check-ins with duplicate protection. Zero friction, zero paperwork.",
    tone: "cyan" as const,
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: "Rank & Gamification",
    text: "Track points, badges, and leaderboard momentum with a FIFA-style rating card.",
    tone: "gold" as const,
  },
];

const toneMap = {
  emerald:
    "from-red-500/20 via-red-500/5 to-transparent border-red-300/25 text-red-100",
  cyan: "from-cyan-500/20 via-cyan-500/5 to-transparent border-cyan-300/25 text-cyan-100",
  gold: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-300/30 text-amber-100",
} as const;

const stats = [
  { value: "QR", label: "Attendance" },
  { value: "RANKED", label: "Leaderboard" },
  { value: "LIVE", label: "Coach Feedback" },
  { value: "24/7", label: "Private Access" },
];

export default async function HomePage() {
  const session = await getAuthSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative overflow-hidden">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(220,38,38,0.2),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 cn-grid-bg opacity-[0.35]"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Nav */}
        <header className="flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-red-100 sm:inline-flex">
              Member Registration Open
            </span>
            <Link
              href="/signup"
              className="cn-btn cn-btn-ghost"
            >
              Member Sign Up
            </Link>
            <Link
              href="/login"
              className="cn-btn cn-btn-primary"
            >
              Private Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
          <div className="cn-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-red-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
              Club Nakhil Platform · Morocco
            </div>

            <h1 className="mt-5 font-heading text-5xl uppercase leading-[0.95] tracking-[0.02em] text-white sm:text-6xl lg:text-[4.5rem]">
              Train Smarter.
              <br />
              <span className="cn-text-green-gradient">Fight Sharper.</span>
              <br />
              Track Every Round.
            </h1>

            <p className="mt-6 max-w-xl text-base text-club-text-soft sm:text-lg">
              Club Nakhil is the private operations platform for our kickboxing
              coaches and members. Run sessions, mark attendance by QR, rate
              coaches, track progress, and climb the leaderboard — all in one
              place, built for the club.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="cn-btn cn-btn-primary !px-6 !py-3.5">
                Enter Club Nakhil
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/signup" className="cn-btn cn-btn-outline !px-6 !py-3.5">
                Create Member Account
              </Link>
              <span className="cn-btn cn-btn-ghost cursor-default !border-amber-300/35 !bg-amber-400/10 !text-amber-100">
                <ShieldCheck className="h-4 w-4" />
                Members & Coaches Only
              </span>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center backdrop-blur-md"
                >
                  <p className="font-heading text-lg font-black uppercase tracking-[0.08em] text-white">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-club-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Showcase card */}
          <div className="cn-rise relative">
            {/* Hero athlete card */}
            <div className="cn-glow-border relative overflow-hidden rounded-[2rem] border border-red-300/25 bg-[linear-gradient(145deg,rgba(10,20,15,0.95)_0%,rgba(6,9,15,0.95)_50%,rgba(0,0,0,0.95)_100%)] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-red-400/25 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 cn-grid-bg opacity-25"
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/40 bg-red-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-100">
                    <Sparkles className="h-3 w-3" />
                    Elite Tier
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100">
                    <Trophy className="h-3 w-3" />
                    Rank #1
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <ClubLogo size={72} framed glow />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-club-muted">
                      Featured Athlete
                    </p>
                    <p className="mt-1 font-heading text-3xl uppercase tracking-[0.04em] text-white">
                      Your Rating
                    </p>
                    <p className="mt-1 text-sm text-red-100/80">
                      Climbs with every round you train.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2">
                  {[
                    { label: "Rating", value: "88", icon: <Star className="h-3.5 w-3.5" /> },
                    { label: "Streak", value: "14d", icon: <Flame className="h-3.5 w-3.5" /> },
                    { label: "Badges", value: "9", icon: <Trophy className="h-3.5 w-3.5" /> },
                    { label: "Wins", value: "32", icon: <Sparkles className="h-3.5 w-3.5" /> },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/10 bg-black/35 px-2 py-2.5 text-center"
                    >
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-club-muted">
                        {stat.icon}
                        {stat.label}
                      </span>
                      <p className="mt-1 font-heading text-xl font-black text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-club-muted">
                    <span>Next Tier Progress</span>
                    <span className="text-red-200">72%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/50">
                    <div className="relative h-full w-[72%] rounded-full bg-gradient-to-r from-red-400 to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                      <div className="absolute inset-0 cn-shimmer opacity-70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating mini cards */}
            <div className="absolute -left-6 -top-6 hidden rotate-[-4deg] rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-400/15 to-amber-900/50 p-4 backdrop-blur-md sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-200">
                Championship
              </p>
              <p className="mt-1 font-heading text-xl uppercase text-white">
                Podium Week
              </p>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="pb-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <article
                key={item.title}
                className={`group relative overflow-hidden rounded-2xl border bg-club-surface/80 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/20 ${toneMap[item.tone]}`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-100 transition group-hover:opacity-70"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
                <div className="relative">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${toneMap[item.tone]}`}
                  >
                    {item.icon}
                  </div>
                  <h2 className="mt-4 font-heading text-xl uppercase tracking-[0.04em] text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-club-text-soft">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-club-muted">
          <span>© Club Nakhil · Kickboxing · Morocco</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
            Platform Live
          </span>
        </footer>
      </div>
    </main>
  );
}
