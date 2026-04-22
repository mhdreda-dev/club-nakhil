import { ClubLogo } from "@/components/club-logo";
import { cn } from "@/lib/utils";

type SplashScreenProps = {
  label?: string;
  className?: string;
};

export function SplashScreen({ label = "Loading", className }: SplashScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex min-h-[50vh] w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(220,38,38,0.18),transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 cn-grid-bg opacity-20" />

      <div className="relative flex flex-col items-center gap-5 cn-rise">
        <div className="cn-logo-spin-container">
          <ClubLogo size={96} priority glow />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[-10px] rounded-full border-2 border-red-400/25 border-t-red-300/85 cn-logo-ring-spin"
          />
        </div>
        <div className="text-center">
          <p className="font-heading text-xl font-black uppercase tracking-[0.28em] text-white">
            Club <span className="cn-text-green-gradient">Nakhil</span>
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-red-300/85">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
