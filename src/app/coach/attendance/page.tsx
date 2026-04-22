import { Role } from "@prisma/client";
import { CalendarCheck2, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatReadableDateTime, formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoachAttendancePage() {
  const session = await requirePageAuth(Role.COACH);

  const sessions = await prisma.trainingSession.findMany({
    where: {
      coachId: session.user.id,
    },
    include: {
      attendances: {
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          checkedInAt: "desc",
        },
      },
    },
    orderBy: [{ sessionDate: "desc" }, { startTime: "desc" }],
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-[0.05em] text-white">Session Attendance</h2>
          <p className="mt-1 text-sm text-club-muted">Track who checked in per training session.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-club-muted">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {sessions.length === 0 ? (
          <div className="cn-empty-state">
            <CalendarCheck2 className="h-8 w-8 opacity-25" />
            <p>No sessions yet. Create one to start tracking attendance.</p>
          </div>
        ) : (
          sessions.map((trainingSession) => (
            <article
              key={trainingSession.id}
              className="rounded-xl border border-white/8 bg-black/20 p-4 transition duration-200 hover:border-white/[0.13]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">{trainingSession.title}</h3>
                  <p className="mt-0.5 text-xs text-club-muted">
                    {formatSessionDate(trainingSession.sessionDate)} · {trainingSession.startTime}–{trainingSession.endTime}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/30 bg-red-500/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-100">
                  <Users className="h-3.5 w-3.5" />
                  {trainingSession.attendances.length} checked in
                </span>
              </div>

              {trainingSession.attendances.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-white/10 bg-black/20 px-3 py-4 text-center text-xs text-club-muted">
                  No attendance recorded yet.
                </div>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-[0.2em] text-club-muted">
                        <th className="pb-2 pr-4">Member</th>
                        <th className="pb-2 pr-4">Email</th>
                        <th className="pb-2">Checked In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingSession.attendances.map((attendance) => (
                        <tr
                          key={attendance.id}
                          className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="py-2.5 pr-4 text-zinc-100">{attendance.member.name}</td>
                          <td className="py-2.5 pr-4 text-club-muted">{attendance.member.email}</td>
                          <td className="py-2.5 text-club-muted">
                            {formatReadableDateTime(attendance.checkedInAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
