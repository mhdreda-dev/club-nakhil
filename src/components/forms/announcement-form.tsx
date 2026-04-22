"use client";

import { Loader2, Megaphone } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.message ?? "Unable to publish announcement.");
      setLoading(false);
      return;
    }

    setTitle("");
    setContent("");
    setMessage("Announcement published.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-club-surface/85 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div className="flex items-start gap-3">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/35 bg-gradient-to-br from-red-500/25 to-red-800/10 text-red-100 shadow-[0_0_22px_rgba(220,38,38,0.22)]">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-2xl uppercase leading-none tracking-[0.04em] text-white">
            Publish Announcement
          </h2>
          <p className="mt-1 text-sm text-club-muted">
            Send reminders, schedule changes, and motivational notes.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <label className="space-y-2 block">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
            Title
          </span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="cn-input"
            placeholder="Example: Monday warm-up starts 10 min earlier"
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
            Message
          </span>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="cn-input resize-none"
            placeholder="Write your note to all members..."
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={loading}
            type="submit"
            className="cn-btn cn-btn-primary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4" />
            )}
            Publish
          </button>

          {message ? (
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
              {message}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
