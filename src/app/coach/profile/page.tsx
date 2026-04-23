import { Activity, Medal, ShieldCheck, Star } from "lucide-react";
import { Role } from "@prisma/client";

import { ProfileEditor } from "@/features/profiles/components/profile-editor";
import { ProfileHeader } from "@/features/profiles/components/profile-header";
import { ProfileMetricGrid } from "@/features/profiles/components/profile-metric-grid";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import { ProfileStatCard } from "@/features/profiles/components/profile-stat-card";
import { getCoachProfilePageData } from "@/features/profiles/profiles.service";
import { formatSessionDate } from "@/lib/format";
import { translateGender } from "@/lib/i18n";
import { requirePageAuth } from "@/lib/page-auth";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function CoachProfilePage() {
  const session = await requirePageAuth(Role.COACH);
  const { intlLocale, t } = await getServerTranslations();
  const pageData = await getCoachProfilePageData(session.user.id)
    .then((data) => ({ ok: true as const, data }))
    .catch(() => ({ ok: false as const }));

  if (!pageData.ok) {
    return (
      <ProfileSection
        title={t("pages.coachProfile.unavailableTitle")}
        description={t("pages.coachProfile.unavailableDescription")}
      >
        <p className="text-sm text-red-200">{t("pages.coachProfile.refresh")}</p>
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
          label={t("pages.coachProfile.averageRating")}
          value={stats.averageRating.toFixed(2)}
          hint={t("pages.coachProfile.averageRatingHint")}
          icon={<Star className="h-4 w-4" />}
        />
        <ProfileStatCard
          label={t("pages.coachProfile.totalReviews")}
          value={stats.totalReviews}
          hint={t("pages.coachProfile.totalReviewsHint")}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <ProfileStatCard
          label={t("pages.coachProfile.sessionsCoached")}
          value={stats.totalSessionsCoached}
          hint={t("pages.coachProfile.sessionsCoachedHint")}
          icon={<Activity className="h-4 w-4" />}
        />
        <ProfileStatCard
          label={t("pages.coachProfile.experience")}
          value={profile.coachProfile?.yearsOfExperience ?? 0}
          hint={t("pages.coachProfile.experienceHint")}
          icon={<Medal className="h-4 w-4" />}
        />
      </ProfileMetricGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProfileSection
          title={t("pages.coachProfile.identityTitle")}
          description={t("pages.coachProfile.identityDescription")}
        >
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("pages.coachProfile.specialization")}</p>
              <p className="mt-1 text-zinc-100">{profile.coachProfile?.specialization ?? t("common.notProvided")}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("pages.coachProfile.coachingStyle")}</p>
              <p className="mt-1 text-zinc-100">{profile.coachProfile?.coachingStyle ?? t("common.notProvided")}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("pages.coachProfile.achievements")}</p>
              <p className="mt-1 text-zinc-100">{profile.coachProfile?.achievements ?? t("common.notProvided")}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("pages.coachProfile.certifications")}</p>
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
                <p className="mt-1 text-zinc-100">{t("pages.coachProfile.noCertifications")}</p>
              )}
            </div>
          </div>
        </ProfileSection>

        <ProfileSection
          title={t("pages.coachProfile.contactTitle")}
          description={t("pages.coachProfile.contactDescription")}
        >
          <div className="space-y-3 text-sm text-zinc-100">
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("auth.email")}</span>
              <br />
              {profile.email}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.phone")}</span>
              <br />
              {profile.phone ?? t("common.notProvided")}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.address")}</span>
              <br />
              {profile.address ?? t("common.notProvided")}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.emergencyContact")}</span>
              <br />
              {profile.emergencyContact ?? t("common.notProvided")}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.gender")}</span>
              <br />
              {profile.gender ? translateGender(t, profile.gender) : t("common.notProvided")}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.dateOfBirth")}</span>
              <br />
              {profile.dateOfBirth ? formatSessionDate(new Date(profile.dateOfBirth), intlLocale) : t("common.notProvided")}
            </p>
          </div>
        </ProfileSection>
      </div>

      <ProfileEditor profile={profile} />
    </div>
  );
}
