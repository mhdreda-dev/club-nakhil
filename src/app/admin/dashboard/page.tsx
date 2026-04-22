import { AccountStatus, Role } from "@prisma/client";
import { ArrowRight, CalendarDays, Clock3, ShieldAlert, UserCheck } from "lucide-react";
import { subDays } from "date-fns";
import Link from "next/link";

import { MetricCard } from "@/components/sports/metric-card";
import { SectionHeader } from "@/components/sports/section-header";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const oneWeekAgo = subDays(new Date(), 7);

  const [pendingMembers, activeMembers, blockedMembers, newRegistrationsThisWeek, recentPending] =
    await Promise.all([
      prisma.user.count({
        where: {
          role: Role.MEMBER,
          status: AccountStatus.PENDING,
        },
      }),
      prisma.user.count({
        where: {
          role: Role.MEMBER,
          status: AccountStatus.ACTIVE,
        },
      }),
      prisma.user.count({
        where: {
          role: Role.MEMBER,
          status: AccountStatus.BLOCKED,
        },
      }),
      prisma.user.count({
        where: {
          role: Role.MEMBER,
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),
      prisma.user.findMany({
        where: {
          role: Role.MEMBER,
          status: AccountStatus.PENDING,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          profileImage: true,
          membershipType: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              memberProfile: {
                select: {
                  trainingLevel: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
    ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Admin Overview"
        title="Member Approval Pipeline"
        subtitle="Track pending requests, active members, and blocked accounts in real time."
        action={
          <Link href="/admin/members" className="cn-btn cn-btn-primary !py-2.5">
            Open Member Manager
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending Approval"
          value={pendingMembers}
          hint="Waiting for admin decision"
          icon={<Clock3 className="h-5 w-5" />}
          tone="amber"
        />
        <MetricCard
          label="Active Members"
          value={activeMembers}
          hint="Can access the platform"
          icon={<UserCheck className="h-5 w-5" />}
          tone="sky"
        />
        <MetricCard
          label="Blocked Members"
          value={blockedMembers}
          hint="Access revoked"
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="rose"
        />
        <MetricCard
          label="New This Week"
          value={newRegistrationsThisWeek}
          hint="Registrations in the last 7 days"
          icon={<CalendarDays className="h-5 w-5" />}
          tone="emerald"
        />
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">
              New User Approvals
            </h2>
            <p className="mt-1 text-sm text-club-muted">
              Review newly self-registered members and process pending approvals quickly.
            </p>
          </div>
          <Link href="/admin/members?status=PENDING" className="cn-btn cn-btn-outline !py-2">
            Review Pending
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {recentPending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center">
              <p className="text-sm text-club-muted">No pending registrations right now.</p>
            </div>
          ) : (
            recentPending.map((member) => (
              <article
                key={member.id}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={member.profile?.displayName ?? member.name}
                      avatarUrl={member.profile?.avatarUrl ?? member.profileImage}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {member.profile?.displayName ?? member.name}
                      </p>
                      <p className="truncate text-xs text-club-muted">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {member.profile?.memberProfile?.trainingLevel ? (
                      <Tag label={member.profile.memberProfile.trainingLevel} tone="cyan" />
                    ) : null}
                    {member.membershipType ? (
                      <Tag label={member.membershipType} tone="gold" />
                    ) : null}
                    <span className="text-xs text-club-muted">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(member.createdAt)}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
