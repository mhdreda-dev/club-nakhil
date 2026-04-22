import { cn } from "@/lib/utils";

type TagTone = "green" | "gold" | "slate" | "cyan" | "rose";

type TagProps = {
  label: string;
  tone?: TagTone;
  className?: string;
};

const toneClasses: Record<TagTone, string> = {
  green: "border-red-300/40 bg-red-500/12 text-red-100",
  gold: "border-amber-300/40 bg-amber-400/12 text-amber-100",
  cyan: "border-cyan-300/40 bg-cyan-500/12 text-cyan-100",
  rose: "border-rose-300/40 bg-rose-500/12 text-rose-100",
  slate: "border-white/15 bg-white/5 text-zinc-200",
};

export function Tag({ label, tone = "slate", className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
