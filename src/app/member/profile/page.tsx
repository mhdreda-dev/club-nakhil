import { Award, Flame, Star, TrendingUp, Trophy, UserRound } from "lucide-react";
import { Role } from "@prisma/client";

import { ProfileEditor } from "@/features/profiles/components/profile-editor";
import { ProfileHeader } from "@/features/profiles/components/profile-header";
import { ProfileMetricGrid } from "@/features/profiles/components/profile-metric-grid";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import { ProfileStatCard } from "@/features/profiles/components/profile-stat-card";
import { getMemberProfilePageData } from "@/features/profiles/profiles.service";
import { formatReadableDateTime, formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage() {
  const session = await requirePageAuth(Role.MEMBER);
  const pageData = await getMemberProfilePageData(session.user.id)
    .then((data) => ({ ok: true as const, data }))
    .catch(() => ({ ok: false as const }));

  if (!pageData.ok) {
    return (
      <ProfileSection title="Profile Unavailable" description="We could not load your profile right now.">
        <p className="text-sm text-red-200">Please refresh the page and try again.</p>
      </ProfileSection>
    );
  }

  const { profile, badges, progressSummary } = pageData.data;

  return (
    <div className="space-y-5">
      <ProfileHeader
        role={profile.role}
        fullName={profile.fullName}
        displayName={profile.displayName}
        avatarUrl={profile.avatarUrl}
        city={profile.city}
        bio={profile.bio}
        joinedAt={profile.joinedAt}
      />

      <ProfileMetricGrid className="xl:grid-cols-5">
        <ProfileStatCard
          label="Attendance"
          value={profile.memberProfile?.attendanceCount ?? 0}
          icon={<UserRound className="h-4 w-4" />}
        />
        <ProfileStatCard
          label="Points"
          value={profile.memberProfile?.totalPoints ?? 0}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <ProfileStatCard
          label="Current Streak"
          value={profile.memberProfile?.currentStreak ?? 0}
          icon={<Flame className="h-4 w-4" />}
        />
        <ProfileStatCard
          label="Overall Rating"
          value={Math.round(profile.memberProfile?.overallRating ?? 0)}
          hint="Attendance, points, streak, badges, and coach progress impact this score"
          icon={<Star className="h-4 w-4" />}
        />
        <ProfileStatCard
          label="Current Rank"
          value={profile.memberProfile?.currentRank ? `#${profile.memberProfile.currentRank}` : "-"}
          hint={
            profile.memberProfile?.previousRank
              ? `Previous #${profile.memberProfile.previousRank}`
              : "No previous rank"
          }
          icon={<Trophy className="h-4 w-4" />}
        />
      </ProfileMetricGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProfileSection title="Training Profile" description="Your current member settings and preferences.">
          <div className="space-y-3 text-sm text-zinc-100">
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Training Level</span>
              <br />
              {profile.memberProfile?.trainingLevel ?? "Not set"}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Preferred Training Type</span>
              <br />
              {profile.memberProfile?.preferredTrainingType ?? "Not set"}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Email</span>
              <br />
              {profile.email}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Phone</span>
              <br />
              {profile.phone ?? "Not provided"}
            </p>
          </div>
        </ProfileSection>

        <ProfileSection title="Progress Summary" description="A quick snapshot of your development journey.">
          <div className="space-y-3 text-sm text-zinc-100">
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Progress Notes</span>
              <br />
              {progressSummary.progressNotesCount}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Last Attendance</span>
              <br />
              {progressSummary.lastAttendanceAt
                ? formatReadableDateTime(new Date(progressSummary.lastAttendanceAt))
                : "No attendance yet"}
            </p>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">Latest Coach Note</p>
              <p className="mt-1 rounded-lg border border-white/10 bg-black/20 p-3 text-zinc-100">
                {progressSummary.latestProgressNote
                  ? `${progressSummary.latestProgressNote.note} — ${progressSummary.latestProgressNote.coachName}`
                  : "No coach note yet."}
              </p>
            </div>
          </div>
        </ProfileSection>
      </div>

      <ProfileSection title="Personal Details" description="Your member identity and contact profile.">
        <div className="grid gap-3 text-sm text-zinc-100 sm:grid-cols-2">
          <p>
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">City</span>
            <br />
            {profile.city ?? "Not provided"}
          </p>
          <p>
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Gender</span>
            <br />
            {profile.gender ?? "Not provided"}
          </p>
          <p>
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Date of Birth</span>
            <br />
            {profile.dateOfBirth ? formatSessionDate(new Date(profile.dateOfBirth)) : "Not provided"}
          </p>
          <p>
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Emergency Contact</span>
            <br />
            {profile.emergencyContact ?? "Not provided"}
          </p>
          <p className="sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Address</span>
            <br />
            {profile.address ?? "Not provided"}
          </p>
        </div>
      </ProfileSection>

      <ProfileSection title="Badges Summary" description="Milestones unlocked through consistency.">
        {badges.length ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300/35 bg-amber-400/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100">
              <Award className="h-3.5 w-3.5" />
              {badges.length} badge{badges.length === 1 ? "" : "s"} earned
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <article key={badge.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="font-semibold text-amber-100">{badge.name}</p>
                  <p className="mt-1 text-xs text-club-muted">{badge.description}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-club-muted">
                    Awarded {formatReadableDateTime(new Date(badge.awardedAt))}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-club-muted">No badges earned yet. Keep training to unlock milestones.</p>
        )}
      </ProfileSection>

      <ProfileEditor profile={profile} />
    </div>
  );
}
