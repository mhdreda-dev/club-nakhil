import { Role } from "@prisma/client";
import { BookOpen, Sparkles, Trophy, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatReadableDateTime } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function MemberProgressPage() {
  const session = await requirePageAuth(Role.MEMBER);
  const { intlLocale, t } = await getServerTranslations();

  const [notes, pointsLogs, badges] = await Promise.all([
    prisma.progressNote.findMany({
      where: {
        memberId: session.user.id,
      },
      include: {
        coach: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.pointsLog.findMany({
      where: {
        memberId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
    prisma.memberBadge.findMany({
      where: {
        memberId: session.user.id,
      },
      include: {
        badge: true,
      },
      orderBy: {
        awardedAt: "desc",
      },
    }),
  ]);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-gradient-to-br from-cyan-500/20 to-cyan-700/5 text-cyan-100">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
            <div>
              <h2 className="font-heading text-xl uppercase tracking-[0.05em] text-white">{t("pages.memberProgress.notesTitle")}</h2>
              <p className="text-xs text-club-muted">{t("pages.memberProgress.notesCount", { count: notes.length })}</p>
            </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {notes.length === 0 ? (
              <div className="cn-empty-state">
                <BookOpen className="h-7 w-7 opacity-25" />
                <p>{t("pages.memberProgress.notesEmpty")}</p>
              </div>
          ) : (
            notes.map((note) => (
              <article key={note.id} className="rounded-xl border border-white/8 bg-black/20 p-4 transition hover:border-cyan-300/20">
                <p className="text-sm leading-relaxed text-zinc-200">{note.note}</p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">{note.coach.name}</span>
                  <span className="text-[10px] text-club-muted">{formatReadableDateTime(note.createdAt, intlLocale)}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-gradient-to-br from-amber-500/20 to-amber-700/5 text-amber-100">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-heading text-xl uppercase tracking-[0.05em] text-white">{t("pages.memberProgress.pointsTitle")}</h2>
              <p className="text-xs text-club-muted">{t("pages.memberProgress.pointsCount", { count: pointsLogs.length })}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {pointsLogs.length === 0 ? (
              <div className="cn-empty-state">
                <Zap className="h-7 w-7 opacity-25" />
                <p>{t("pages.memberProgress.pointsEmpty")}</p>
              </div>
            ) : (
              pointsLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-white/8 bg-black/20 px-3.5 py-2.5 transition hover:border-amber-300/20"
                >
                  <p className="text-sm text-zinc-200">{log.reason}</p>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="font-heading text-sm font-bold text-amber-300">+{log.points}</span>
                    <span className="text-[10px] text-club-muted">{formatReadableDateTime(log.createdAt, intlLocale)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-gradient-to-br from-amber-500/20 to-amber-700/5 text-amber-100">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-heading text-xl uppercase tracking-[0.05em] text-white">{t("pages.memberProgress.badgesTitle")}</h2>
              <p className="text-xs text-club-muted">{t("pages.memberProgress.badgesCount", { count: badges.length })}</p>
            </div>
          </div>

          <div className="mt-5">
            {badges.length === 0 ? (
              <div className="cn-empty-state">
                <Trophy className="h-7 w-7 opacity-25" />
                <p>{t("pages.memberProgress.badgesEmpty")}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((memberBadge) => (
                  <span
                    key={memberBadge.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-400/12 px-3 py-1.5 text-xs font-semibold tracking-[0.1em] text-amber-100 transition hover:border-amber-300/55 hover:bg-amber-400/18"
                  >
                    <Sparkles className="h-3 w-3" />
                    {memberBadge.badge.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
