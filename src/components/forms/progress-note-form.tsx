"use client";

import { Loader2, NotebookPen } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ProgressNoteFormProps = {
  memberId: string;
};

export function ProgressNoteForm({ memberId }: ProgressNoteFormProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/progress-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberId, note }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.message ?? "Unable to add progress note.");
      setLoading(false);
      return;
    }

    setNote("");
    setLoading(false);
    setMessage("Progress note saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        required
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="cn-input resize-none"
        placeholder="Add a coaching observation for this member"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={loading}
          type="submit"
          className="cn-btn cn-btn-outline"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <NotebookPen className="h-3.5 w-3.5" />}
          Save Note
        </button>
        {message ? (
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
