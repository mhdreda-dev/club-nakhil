import { Role } from "@prisma/client";
import { CalendarClock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MemberSessionsPage() {
  const session = await requirePageAuth(Role.MEMBER);

  const sessions = await prisma.trainingSession.findMany({
    include: {
      coach: {
        select: {
          name: true,
        },
      },
      attendances: {
        where: {
          memberId: session.user.id,
        },
      },
      ratings: {
        where: {
          memberId: session.user.id,
        },
      },
    },
    orderBy: [{ sessionDate: "desc" }, { startTime: "desc" }],
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-[0.05em] text-white">My Sessions</h2>
          <p className="mt-1 text-sm text-club-muted">All training sessions and your attendance status.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-club-muted">
          <CalendarClock className="h-3.5 w-3.5" />
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="cn-empty-state mt-5">
          <CalendarClock className="h-8 w-8 opacity-25" />
          <p>No sessions available yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-[0.2em] text-club-muted">
                  <th className="pb-3 pr-4">Session</th>
                  <th className="pb-3 pr-4">Schedule</th>
                  <th className="pb-3 pr-4">Coach</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((trainingSession) => {
                  const attended = trainingSession.attendances.length > 0;
                  const rated = trainingSession.ratings.length > 0;

                  return (
                    <tr
                      key={trainingSession.id}
                      className="group border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-white">{trainingSession.title}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-club-muted">
                          {trainingSession.trainingType.toLowerCase()} · {trainingSession.level.toLowerCase()}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="text-club-text-soft">{formatSessionDate(trainingSession.sessionDate)}</p>
                        <p className="mt-0.5 text-xs text-club-muted">{trainingSession.startTime}–{trainingSession.endTime}</p>
                      </td>
                      <td className="py-3.5 pr-4 text-club-text-soft">{trainingSession.coach.name}</td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <Tag label={attended ? "Attended" : "Not checked in"} tone={attended ? "green" : "slate"} />
                          <Tag label={rated ? "Rated" : "Pending"} tone={rated ? "gold" : "slate"} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-5 space-y-2.5 md:hidden">
            {sessions.map((trainingSession) => {
              const attended = trainingSession.attendances.length > 0;
              const rated = trainingSession.ratings.length > 0;

              return (
                <article
                  key={trainingSession.id}
                  className="rounded-xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{trainingSession.title}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-club-muted">
                        {trainingSession.trainingType.toLowerCase()} · {trainingSession.level.toLowerCase()}
                      </p>
                    </div>
                    <Tag label={attended ? "Attended" : "Absent"} tone={attended ? "green" : "slate"} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-club-muted">
                    <span>{formatSessionDate(trainingSession.sessionDate)}</span>
                    <span>·</span>
                    <span>{trainingSession.startTime}–{trainingSession.endTime}</span>
                    <span>·</span>
                    <span>Coach {trainingSession.coach.name}</span>
                  </div>
                  {rated ? (
                    <div className="mt-2">
                      <Tag label="Rated" tone="gold" />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
