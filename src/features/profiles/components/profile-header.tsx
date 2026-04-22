import { Role } from "@prisma/client";
import { Calendar, MapPin } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { formatSessionDate } from "@/lib/format";
import { RoleBadge } from "@/features/profiles/components/role-badge";

type ProfileHeaderProps = {
  role: Role;
  fullName: string;
  displayName: string;
  avatarUrl?: string | null;
  city?: string | null;
  bio?: string | null;
  joinedAt: string;
};

export function ProfileHeader({
  role,
  fullName,
  displayName,
  avatarUrl,
  city,
  bio,
  joinedAt,
}: ProfileHeaderProps) {
  return (
    <section className="cn-glow-border relative overflow-hidden rounded-3xl border border-red-300/25 bg-[linear-gradient(135deg,rgba(35,8,8,0.95)_0%,rgba(6,9,15,0.95)_55%,rgba(25,20,5,0.8)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.5)] sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-red-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 cn-grid-bg opacity-25"
      />

      <div className="relative flex flex-wrap items-start gap-5">
        <Avatar
          name={displayName || fullName}
          avatarUrl={avatarUrl}
          size="xl"
          className="h-24 w-24 border-red-200/40 shadow-[0_0_0_3px_rgba(220,38,38,0.2)]"
        />

        <div className="min-w-[220px] flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-3xl uppercase leading-none tracking-[0.04em] text-white md:text-4xl">
              {displayName}
            </h2>
            <RoleBadge role={role} />
          </div>

          {displayName !== fullName ? (
            <p className="text-sm text-club-text-soft">{fullName}</p>
          ) : null}

          <div className="mt-1 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-100/90">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatSessionDate(new Date(joinedAt))}
            </span>
            {city ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-100/90">
                <MapPin className="h-3.5 w-3.5" />
                {city}
              </span>
            ) : null}
          </div>

          {bio ? (
            <p className="mt-3 max-w-3xl text-sm text-club-text-soft">{bio}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
