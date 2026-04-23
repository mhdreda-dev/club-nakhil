import { Award, Flame, Star, TrendingUp, Trophy, UserRound } from "lucide-react";
import { Role } from "@prisma/client";

import { ProfileEditor } from "@/features/profiles/components/profile-editor";
import { ProfileHeader } from "@/features/profiles/components/profile-header";
import { ProfileMetricGrid } from "@/features/profiles/components/profile-metric-grid";
import { normalizeMemberProfile } from "@/features/profiles/member-profile";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import { ProfileStatCard } from "@/features/profiles/components/profile-stat-card";
import { getMemberProfilePageData } from "@/features/profiles/profiles.service";
import { formatReadableDateTime, formatSessionDate } from "@/lib/format";
import {
  translateGender,
  translateTrainingLevel,
  translateTrainingType,
} from "@/lib/i18n";
import { requirePageAuth } from "@/lib/page-auth";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage() {
  const session = await requirePageAuth(Role.MEMBER);
  const { intlLocale, t } = await getServerTranslations();
  const pageData = await getMemberProfilePageData(session.user.id)
    .then((data) => ({ ok: true as const, data }))
    .catch(() => ({ ok: false as const }));

  if (!pageData.ok) {
    return (
      <ProfileSection
        title={t("pages.memberProfile.unavailableTitle")}
        description={t("pages.memberProfile.unavailableDescription")}
      >
        <p className="text-sm text-red-200">{t("pages.memberProfile.refresh")}</p>
      </ProfileSection>
    );
  }

  const { profile, badges, progressSummary } = pageData.data;
  const memberProfile = normalizeMemberProfile(profile.memberProfile);
  const hasTrackedPerformance =
    memberProfile.overallRating > 0 ||
    memberProfile.attendanceCount > 0 ||
    memberProfile.totalPoints > 0 ||
    memberProfile.currentStreak > 0 ||
    badges.length > 0;

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
          label={t("pages.memberProfile.attendance")}
          value={memberProfile.attendanceCount}
          icon={<UserRound className="h-4 w-4" />}
        />
        <ProfileStatCard
          label={t("pages.memberProfile.points")}
          value={memberProfile.totalPoints}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <ProfileStatCard
          label={t("pages.memberProfile.currentStreak")}
          value={memberProfile.currentStreak}
          icon={<Flame className="h-4 w-4" />}
        />
        <ProfileStatCard
          label={t("pages.memberProfile.overallRating")}
          value={Math.round(memberProfile.overallRating)}
          hint={t("pages.memberProfile.overallRatingHint")}
          icon={<Star className="h-4 w-4" />}
        />
        <ProfileStatCard
          label={t("pages.memberProfile.currentRank")}
          value={hasTrackedPerformance && memberProfile.currentRank ? `#${memberProfile.currentRank}` : "-"}
          hint={
            hasTrackedPerformance && memberProfile.previousRank
              ? t("pages.memberProfile.previousRank", { rank: memberProfile.previousRank })
              : t("pages.memberProfile.currentRankHint")
          }
          icon={<Trophy className="h-4 w-4" />}
        />
      </ProfileMetricGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProfileSection
          title={t("pages.memberProfile.trainingProfileTitle")}
          description={t("pages.memberProfile.trainingProfileDescription")}
        >
          <div className="space-y-3 text-sm text-zinc-100">
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.trainingLevel")}</span>
              <br />
              {translateTrainingLevel(t, memberProfile.trainingLevel)}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.preferredTrainingType")}</span>
              <br />
              {memberProfile.preferredTrainingType ? translateTrainingType(t, memberProfile.preferredTrainingType) : t("common.notSet")}
            </p>
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
          </div>
        </ProfileSection>

        <ProfileSection
          title={t("pages.memberProfile.progressSummaryTitle")}
          description={t("pages.memberProfile.progressSummaryDescription")}
        >
          <div className="space-y-3 text-sm text-zinc-100">
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("pages.memberProfile.progressNotes")}</span>
              <br />
              {progressSummary.progressNotesCount}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("pages.memberProfile.lastAttendance")}</span>
              <br />
              {progressSummary.lastAttendanceAt
                ? formatReadableDateTime(new Date(progressSummary.lastAttendanceAt), intlLocale)
                : t("pages.memberProfile.lastAttendanceEmpty")}
            </p>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("pages.memberProfile.latestCoachNote")}</p>
              <p className="mt-1 rounded-lg border border-white/10 bg-black/20 p-3 text-zinc-100">
                {progressSummary.latestProgressNote
                  ? `${progressSummary.latestProgressNote.note} — ${progressSummary.latestProgressNote.coachName}`
                  : t("pages.memberProfile.latestCoachNoteEmpty")}
              </p>
            </div>
          </div>
        </ProfileSection>
      </div>

      <ProfileSection
        title={t("pages.memberProfile.personalDetailsTitle")}
        description={t("pages.memberProfile.personalDetailsDescription")}
      >
        <div className="grid gap-3 text-sm text-zinc-100 sm:grid-cols-2">
          <p>
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.city")}</span>
            <br />
            {profile.city ?? t("common.notProvided")}
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
          <p>
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.emergencyContact")}</span>
            <br />
            {profile.emergencyContact ?? t("common.notProvided")}
          </p>
          <p className="sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-club-muted">{t("profile.editor.fields.address")}</span>
            <br />
            {profile.address ?? t("common.notProvided")}
          </p>
        </div>
      </ProfileSection>

      <ProfileSection title={t("pages.memberProfile.badgesTitle")} description={t("pages.memberProfile.badgesDescription")}>
        {badges.length ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300/35 bg-amber-400/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100">
              <Award className="h-3.5 w-3.5" />
              {t("pages.memberProfile.badgesEarned", { count: badges.length })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <article key={badge.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="font-semibold text-amber-100">{badge.name}</p>
                  <p className="mt-1 text-xs text-club-muted">{badge.description}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-club-muted">
                    {t("pages.memberProfile.awarded", {
                      date: formatReadableDateTime(new Date(badge.awardedAt), intlLocale),
                    })}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-club-muted">{t("pages.memberProfile.badgesEmpty")}</p>
        )}
      </ProfileSection>

      <ProfileEditor profile={profile} />
    </div>
  );
}
