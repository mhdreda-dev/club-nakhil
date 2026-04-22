import { Activity, Medal, ShieldCheck, Star } from "lucide-react";
import { Role } from "@prisma/client";

import { ProfileEditor } from "@/features/profiles/components/profile-editor";
import { ProfileHeader } from "@/features/profiles/components/profile-header";
import { ProfileMetricGrid } from "@/features/profiles/components/profile-metric-grid";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import { ProfileStatCard } from "@/features/profiles/components/profile-stat-card";
import { getCoachProfilePageData } from "@/features/profiles/profiles.service";
import { formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

export default async function CoachProfilePage() {
  const session = await requirePageAuth(Role.COACH);
  const pageData = await getCoachProfilePageData(session.user.id)
    .then((data) => ({ ok: true as const, data }))
    .catch(() => ({ ok: false as const }));

  if (!pageData.ok) {
    return (
      <ProfileSection title="Profile Unavailable" description="We could not load your profile right now.">
        <p className="text-sm text-red-200">Please refresh the page and try again.</p>
      </ProfileSection>
    );
  }

  const { profile, stats } = pageData.data;

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

      <ProfileMetricGrid>
        <ProfileStatCard
          label="Average Rating"
          value={stats.averageRating.toFixed(2)}
          hint="From member reviews"
          icon={<Star className="h-4 w-4" />}
        />
        <ProfileStatCard
          label="Total Reviews"
          value={stats.totalReviews}
          hint="Member feedback submitted"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <ProfileStatCard
          label="Sessions Coached"
          value={stats.totalSessionsCoached}
          hint="Total planned sessions"
          icon={<Activity className="h-4 w-4" />}
        />
        <ProfileStatCard
          label="Experience"
          value={profile.coachProfile?.yearsOfExperience ?? 0}
          hint="Years"
          icon={<Medal className="h-4 w-4" />}
        />
      </ProfileMetricGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProfileSection title="Coach Identity" description="Your coaching specialization and style.">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">Specialization</p>
              <p className="mt-1 text-zinc-100">{profile.coachProfile?.specialization ?? "Not specified"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">Coaching Style</p>
              <p className="mt-1 text-zinc-100">{profile.coachProfile?.coachingStyle ?? "Not specified"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">Achievements</p>
              <p className="mt-1 text-zinc-100">{profile.coachProfile?.achievements ?? "Not specified"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">Certifications</p>
              {profile.coachProfile?.certifications?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.coachProfile.certifications.map((certification) => (
                    <span
                      key={certification}
                      className="rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100"
                    >
                      {certification}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-zinc-100">No certifications added yet.</p>
              )}
            </div>
          </div>
        </ProfileSection>

        <ProfileSection title="Contact" description="Private contact details for internal club use.">
          <div className="space-y-3 text-sm text-zinc-100">
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
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Address</span>
              <br />
              {profile.address ?? "Not provided"}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">Emergency Contact</span>
              <br />
              {profile.emergencyContact ?? "Not provided"}
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
          </div>
        </ProfileSection>
      </div>

      <ProfileEditor profile={profile} />
    </div>
  );
}
