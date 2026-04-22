import { cn } from "@/lib/utils";

export type Attribute = {
  code: string;
  label: string;
  value: number; // 40–99
};

type AttributeGridProps = {
  attributes: Attribute[];
  className?: string;
};

function scoreColor(v: number) {
  if (v >= 85) return "text-yellow-300";
  if (v >= 75) return "text-amber-300";
  if (v >= 65) return "text-red-300";
  if (v >= 55) return "text-cyan-300";
  return "text-zinc-300";
}

function barFill(v: number) {
  if (v >= 85) return "bg-gradient-to-r from-yellow-500 to-yellow-300";
  if (v >= 75) return "bg-gradient-to-r from-amber-500 to-amber-300";
  if (v >= 65) return "bg-gradient-to-r from-red-500 to-red-300";
  if (v >= 55) return "bg-gradient-to-r from-cyan-500 to-cyan-300";
  return "bg-gradient-to-r from-zinc-500 to-zinc-300";
}

export function AttributeGrid({ attributes, className }: AttributeGridProps) {
  const half = Math.ceil(attributes.length / 2);
  const cols = [attributes.slice(0, half), attributes.slice(half)];

  return (
    <div className={cn("grid grid-cols-2 gap-x-6 gap-y-2.5", className)}>
      {cols.map((col, ci) => (
        <div key={ci} className="space-y-2.5">
          {col.map((attr) => {
            const pct = Math.round(((attr.value - 40) / 59) * 100);
            return (
              <div key={attr.code} className="group">
                <div className="flex items-center gap-2">
                  <span className="w-[30px] shrink-0 text-[9px] font-black uppercase tracking-[0.2em] text-white/45 transition-colors group-hover:text-white/70">
                    {attr.code}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/50">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", barFill(attr.value))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-7 shrink-0 text-right font-heading text-[13px] font-black leading-none",
                      scoreColor(attr.value),
                    )}
                  >
                    {attr.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
