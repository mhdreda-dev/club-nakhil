import { AccountStatus, Role } from "@prisma/client";
import { AlertTriangle, Award, ShieldAlert, Sparkles } from "lucide-react";

import { ProgressNoteForm } from "@/components/forms/progress-note-form";
import { AthleteSummaryCard } from "@/components/sports/athlete-summary-card";
import { SectionHeader } from "@/components/sports/section-header";
import { Card } from "@/components/ui/card";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoachMembersPage() {
  const session = await requirePageAuth(Role.COACH);

  const members = await prisma.user.findMany({
    where: {
      role: Role.MEMBER,
      status: AccountStatus.ACTIVE,
    },
    include: {
      attendances: {
        select: {
          id: true,
        },
      },
      pointsLogs: {
        select: {
          points: true,
        },
      },
      memberBadges: {
        include: {
          badge: true,
        },
      },
      profile: {
        select: {
          displayName: true,
          avatarUrl: true,
          memberProfile: {
            select: {
              overallRating: true,
              currentRank: true,
              previousRank: true,
              rankChange: true,
            },
          },
        },
      },
      progressNotesReceived: {
        where: {
          coachId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const athletes = members.map((member) => {
    const points = member.pointsLogs.reduce((sum, item) => sum + item.points, 0);

    return {
      id: member.id,
      name: member.profile?.displayName ?? member.name,
      email: member.email,
      avatarUrl: member.profile?.avatarUrl ?? null,
      attendanceCount: member.attendances.length,
      points,
      badgesCount: member.memberBadges.length,
      overallRating: Math.round(member.profile?.memberProfile?.overallRating ?? 0),
      rank: member.profile?.memberProfile?.currentRank ?? null,
      rankChange: member.profile?.memberProfile?.rankChange ?? 0,
      latestNote: member.progressNotesReceived[0]?.note ?? null,
    };
  });

  const topPerformers = [...athletes]
    .sort((a, b) => {
      if (b.overallRating !== a.overallRating) {
        return b.overallRating - a.overallRating;
      }

      if (a.rank !== null && b.rank !== null) {
        return a.rank - b.rank;
      }

      return b.points - a.points;
    })
    .slice(0, 3);

  const needsAttention = [...athletes]
    .filter((athlete) => athlete.overallRating < 60 || athlete.rankChange < 0 || athlete.attendanceCount < 3)
    .sort((a, b) => a.overallRating - b.overallRating)
    .slice(0, 4);

  const topPerformerIds = new Set(topPerformers.map((athlete) => athlete.id));
  const needsAttentionIds = new Set(needsAttention.map((athlete) => athlete.id));

  const averageRating =
    athletes.length > 0 ? Math.round(athletes.reduce((sum, athlete) => sum + athlete.overallRating, 0) / athletes.length) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Coach Intelligence"
        title="Member Performance"
        subtitle="Review athlete progression, rank movement, and targeted coaching opportunities."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-red-300/20 bg-gradient-to-br from-red-500/15 via-club-surface to-transparent">
          <p className="text-[11px] uppercase tracking-[0.16em] text-club-muted">Total Members</p>
          <p className="mt-2 text-3xl font-black text-white">{athletes.length}</p>
          <p className="mt-2 text-xs text-red-100/80">Active roster under your supervision.</p>
        </Card>
        <Card className="border-cyan-300/20 bg-gradient-to-br from-cyan-500/15 via-club-surface to-transparent">
          <p className="text-[11px] uppercase tracking-[0.16em] text-club-muted">Average Rating</p>
          <p className="mt-2 text-3xl font-black text-white">{averageRating}</p>
          <p className="mt-2 text-xs text-cyan-100/80">Current squad performance baseline.</p>
        </Card>
        <Card className="border-amber-300/25 bg-gradient-to-br from-amber-500/16 via-club-surface to-transparent">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-club-muted">Top Performers</p>
            <Sparkles className="h-4 w-4 text-amber-200" />
          </div>
          <p className="mt-2 text-3xl font-black text-white">{topPerformers.length}</p>
          <p className="mt-2 text-xs text-amber-100/80">Athletes currently leading the board.</p>
        </Card>
        <Card className="border-rose-300/25 bg-gradient-to-br from-rose-500/16 via-club-surface to-transparent">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-club-muted">Need Attention</p>
            <ShieldAlert className="h-4 w-4 text-rose-200" />
          </div>
          <p className="mt-2 text-3xl font-black text-white">{needsAttention.length}</p>
          <p className="mt-2 text-xs text-rose-100/80">Members needing close coaching follow-up.</p>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-amber-300/25 bg-black/20">
          <h3 className="font-heading text-xl uppercase tracking-[0.08em] text-white">Top Performers</h3>
          <div className="mt-3 space-y-2">
            {topPerformers.length === 0 ? (
              <p className="text-sm text-club-muted">No member performance data yet.</p>
            ) : (
              topPerformers.map((athlete) => (
                <div key={athlete.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div>
                    <p className="font-semibold text-white">{athlete.name}</p>
                    <p className="text-xs text-club-muted">Rank {athlete.rank ? `#${athlete.rank}` : "-"}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-100">
                    <Award className="h-3.5 w-3.5" />
                    {athlete.overallRating}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border-rose-300/25 bg-black/20">
          <h3 className="font-heading text-xl uppercase tracking-[0.08em] text-white">Needs Attention</h3>
          <div className="mt-3 space-y-2">
            {needsAttention.length === 0 ? (
              <p className="text-sm text-club-muted">All tracked athletes are currently stable.</p>
            ) : (
              needsAttention.map((athlete) => (
                <div key={athlete.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div>
                    <p className="font-semibold text-white">{athlete.name}</p>
                    <p className="text-xs text-club-muted">
                      Rating {athlete.overallRating} • Attendance {athlete.attendanceCount}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/35 bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-100">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Monitor
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {athletes.map((athlete) => (
          <AthleteSummaryCard
            key={athlete.id}
            name={athlete.name}
            email={athlete.email}
            avatarUrl={athlete.avatarUrl}
            attendanceCount={athlete.attendanceCount}
            points={athlete.points}
            badgesCount={athlete.badgesCount}
            overallRating={athlete.overallRating}
            rank={athlete.rank}
            rankChange={athlete.rankChange}
            latestNote={athlete.latestNote}
            isTopPerformer={topPerformerIds.has(athlete.id)}
            needsAttention={needsAttentionIds.has(athlete.id)}
          >
            <ProgressNoteForm memberId={athlete.id} />
          </AthleteSummaryCard>
        ))}
      </section>
    </div>
  );
}
