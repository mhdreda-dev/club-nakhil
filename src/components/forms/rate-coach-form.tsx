"use client";

import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useTranslations } from "@/components/providers/translations-provider";

type RateCoachFormProps = {
  sessionId: string;
  defaultScore?: number;
  defaultComment?: string | null;
};

export function RateCoachForm({
  sessionId,
  defaultScore = 5,
  defaultComment = "",
}: RateCoachFormProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const [score, setScore] = useState(defaultScore);
  const [comment, setComment] = useState(defaultComment ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/ratings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, score, comment }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(payload.message ?? t("forms.rateCoach.errors.submit"));
      setLoading(false);
      return;
    }

    setMessage(t("forms.rateCoach.success"));
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-black/25 to-black/40 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label
          className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft"
          htmlFor={`score-${sessionId}`}
        >
          {t("forms.rateCoach.fields.rating")}
        </label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= score;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                className={`group inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                  active
                    ? "border-amber-300/55 bg-amber-400/15 text-amber-200 shadow-[0_0_18px_rgba(255,193,64,0.25)]"
                    : "border-white/10 bg-black/25 text-zinc-500 hover:border-amber-300/35 hover:text-amber-200"
                }`}
                aria-label={t("forms.rateCoach.aria.rateStars", { count: value })}
              >
                <Star
                  className={`h-4 w-4 transition ${active ? "fill-amber-300/80" : ""}`}
                />
              </button>
            );
          })}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/85">
          {t("forms.rateCoach.score", { value: score })}
        </span>
      </div>

      <label className="space-y-2 block">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
          {t("forms.rateCoach.fields.comment")}
        </span>
        <textarea
          rows={2}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="cn-input resize-none"
          placeholder={t("forms.rateCoach.placeholder")}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={loading}
          type="submit"
          className="cn-btn cn-btn-outline !border-amber-300/40 !text-amber-100 hover:!bg-amber-500/10"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className="h-3.5 w-3.5" />
          )}
          {loading
            ? t("forms.rateCoach.actions.submitting")
            : t("forms.rateCoach.actions.submit")}
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
