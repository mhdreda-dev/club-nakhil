import Image from "next/image";
import { cn } from "@/lib/utils";

type ClubLogoProps = {
  size?: number;
  priority?: boolean;
  className?: string;
  framed?: boolean;
  glow?: boolean;
};

export function ClubLogo({
  size = 42,
  priority = false,
  className,
  framed = false,
  glow = false,
}: ClubLogoProps) {
  const img = (
    <Image
      src="/club-nakhil-logo.png"
      alt="Club Nakhil"
      width={size}
      height={size}
      priority={priority}
      quality={100}
      draggable={false}
      className={cn(
        "object-cover rounded-full scale-125",
        glow && "drop-shadow-[0_0_15px_rgba(220,38,38,0.45)]"
      )}
      style={{
        width: size,
        height: size,
      }}
    />
  );

  if (!framed) {
    return (
      <div
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          className
        )}
        style={{
          width: size,
          height: size,
        }}
      >
        {img}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-2xl p-1",
        "border border-white/10 bg-white/5 backdrop-blur-md",
        "shadow-[0_8px_25px_rgba(0,0,0,0.45)]",
        className
      )}
      style={{
        width: size + 12,
        height: size + 12,
      }}
    >
      <div
        className="overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
        }}
      >
        {img}
      </div>
    </div>
  );
}
