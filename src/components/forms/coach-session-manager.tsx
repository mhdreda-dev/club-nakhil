"use client";

import { TrainingLevel, TrainingType } from "@prisma/client";
import {
  CalendarPlus,
  Clock,
  Layers,
  Loader2,
  Pencil,
  QrCode,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { trainingLevelOptions, trainingTypeOptions } from "@/lib/domain";

type SessionItem = {
  id: string;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  trainingType: TrainingType;
  level: TrainingLevel;
  notes: string | null;
  attendanceCount: number;
  qrToken: string;
  qrDataUrl: string;
};

type SessionFormState = {
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  trainingType: TrainingType;
  level: TrainingLevel;
  notes: string;
};

const initialFormState: SessionFormState = {
  title: "",
  sessionDate: "",
  startTime: "19:00",
  endTime: "20:00",
  trainingType: "TECHNIQUE",
  level: "BEGINNER",
  notes: "",
};

type CoachSessionManagerProps = {
  sessions: SessionItem[];
};

export function CoachSessionManager({ sessions }: CoachSessionManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<SessionFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isEditMode = Boolean(editingId);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)),
    [sessions],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = editingId ? `/api/sessions/${editingId}` : "/api/sessions";
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.message ?? "Unable to save session.");
      setLoading(false);
      return;
    }

    setMessage(editingId ? "Session updated." : "Session created.");
    setForm(initialFormState);
    setEditingId(null);
    setLoading(false);
    router.refresh();
  }

  function startEditing(session: SessionItem) {
    setEditingId(session.id);
    setForm({
      title: session.title,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      trainingType: session.trainingType,
      level: session.level,
      notes: session.notes ?? "",
    });
    setMessage(null);
  }

  async function removeSession(id: string) {
    if (!confirm("Delete this session and related attendance/ratings?")) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/sessions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setMessage("Unable to delete session.");
      setLoading(false);
      return;
    }

    setMessage("Session deleted.");
    if (editingId === id) {
      setEditingId(null);
      setForm(initialFormState);
    }
    setLoading(false);
    router.refresh();
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialFormState);
    setMessage(null);
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-club-surface/85 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-red-400/10 blur-3xl"
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/35 bg-gradient-to-br from-red-500/25 to-red-800/10 text-red-100 shadow-[0_0_22px_rgba(220,38,38,0.22)]">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-2xl uppercase leading-none tracking-[0.04em] text-white">
                {isEditMode ? "Edit Session" : "Create New Session"}
              </h2>
              <p className="mt-1 text-sm text-club-muted">
                Define date, training type, level, and notes. QR is generated automatically.
              </p>
            </div>
          </div>
          {isEditMode ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/45 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100">
              <Pencil className="h-3 w-3" /> Editing
            </span>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
              Title
            </span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="cn-input"
              placeholder="Example: Technique Masterclass"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
              Date
            </span>
            <input
              required
              type="date"
              value={form.sessionDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sessionDate: event.target.value }))
              }
              className="cn-input"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                Start
              </span>
              <input
                required
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startTime: event.target.value }))
                }
                className="cn-input"
              />
            </label>
            <label className="space-y-2 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                End
              </span>
              <input
                required
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endTime: event.target.value }))
                }
                className="cn-input"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
              Training Type
            </span>
            <select
              value={form.trainingType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trainingType: event.target.value as TrainingType }))
              }
              className="cn-input"
            >
              {trainingTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
              Level
            </span>
            <select
              value={form.level}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, level: event.target.value as TrainingLevel }))
              }
              className="cn-input"
            >
              {trainingLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 sm:col-span-2 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
              Coach Notes
            </span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="cn-input resize-none"
              placeholder="Optional focus, reminders, or prep notes"
            />
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              disabled={loading}
              type="submit"
              className="cn-btn cn-btn-primary"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditMode ? "Save Changes" : "Create Session"}
            </button>

            {isEditMode ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="cn-btn cn-btn-ghost"
              >
                <X className="h-4 w-4" />
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        {message ? (
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
            {message}
          </p>
        ) : null}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-club-surface/85 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/35 bg-gradient-to-br from-red-500/25 to-red-800/10 text-red-100 shadow-[0_0_22px_rgba(220,38,38,0.22)]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-2xl uppercase leading-none tracking-[0.04em] text-white">
              Existing Sessions
            </h2>
            <p className="mt-1 text-sm text-club-muted">
              {sortedSessions.length} total{" "}
              {sortedSessions.length === 1 ? "session" : "sessions"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {sortedSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/12 bg-black/20 p-8 text-center">
              <p className="text-sm text-club-muted">
                No sessions created yet. Launch your first one above.
              </p>
            </div>
          ) : (
            sortedSessions.map((session) => (
              <article
                key={session.id}
                className="relative grid gap-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-black/25 to-black/40 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.32)] transition hover:border-red-300/30 lg:grid-cols-[1fr_180px]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg uppercase tracking-[0.02em] text-white">
                      {session.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/40 bg-red-500/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-red-100">
                      {session.trainingType.toLowerCase()}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-500/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-100">
                      {session.level.toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-club-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-red-200/80" />
                      {session.sessionDate} • {session.startTime} – {session.endTime}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-red-200/80" />
                      Attendance: {session.attendanceCount}
                    </span>
                  </div>

                  {session.notes ? (
                    <p className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-club-text-soft">
                      {session.notes}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(session)}
                      className="cn-btn cn-btn-outline !py-1.5 !text-[11px]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSession(session.id)}
                      className="cn-btn cn-btn-danger !py-1.5 !text-[11px]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl border border-white/10 bg-zinc-950/40 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                  <div className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full border border-red-300/45 bg-club-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-red-100">
                    <QrCode className="h-3 w-3" />
                    QR
                  </div>
                  <Image
                    src={session.qrDataUrl}
                    alt={`QR for ${session.title}`}
                    width={220}
                    height={220}
                    unoptimized
                    className="h-full w-full rounded-lg bg-white p-2"
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
