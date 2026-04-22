"use client";

import { Camera, Loader2, QrCode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SCANNER_REGION_ID = "club-nakhil-scanner";

function extractToken(rawValue: string) {
  try {
    const parsedUrl = new URL(rawValue);
    return parsedUrl.searchParams.get("token") ?? rawValue;
  } catch {
    return rawValue;
  }
}

type AttendanceScannerProps = {
  initialToken?: string;
};

type AttendanceRewardDetails = {
  pointsAwarded: number;
  totalPoints: number;
  attendanceCount: number;
  currentStreak: number;
  currentRank: number | null;
  rankChange: number;
  trend: "up" | "down" | "same";
};

export function AttendanceScanner({ initialToken }: AttendanceScannerProps) {
  const router = useRouter();
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void | Promise<void>;
  } | null>(null);
  const [tokenInput, setTokenInput] = useState(initialToken ?? "");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewardDetails, setRewardDetails] = useState<AttendanceRewardDetails | null>(null);

  const submitToken = useCallback(
    async (rawToken: string) => {
      const qrToken = extractToken(rawToken.trim());
      if (!qrToken) {
        setError("Please scan a valid QR code or enter token.");
        return;
      }

      setLoading(true);
      setError(null);
      setMessage(null);
      setRewardDetails(null);

      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrToken }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.message ?? "Unable to mark attendance");
        setLoading(false);
        return;
      }

      const payloadData = payload.data as
        | {
            pointsAwarded?: number;
            metrics?: {
              totalPoints?: number;
              attendanceCount?: number;
              currentStreak?: number;
              currentRank?: number | null;
              rankChange?: number;
              trend?: "up" | "down" | "same";
            };
          }
        | undefined;

      if (
        payloadData?.pointsAwarded !== undefined &&
        payloadData.metrics?.totalPoints !== undefined &&
        payloadData.metrics.attendanceCount !== undefined &&
        payloadData.metrics.currentStreak !== undefined &&
        payloadData.metrics.rankChange !== undefined &&
        payloadData.metrics.trend !== undefined
      ) {
        setRewardDetails({
          pointsAwarded: payloadData.pointsAwarded,
          totalPoints: payloadData.metrics.totalPoints,
          attendanceCount: payloadData.metrics.attendanceCount,
          currentStreak: payloadData.metrics.currentStreak,
          currentRank: payloadData.metrics.currentRank ?? null,
          rankChange: payloadData.metrics.rankChange,
          trend: payloadData.metrics.trend,
        });
      }

      setMessage(payload.message ?? "Attendance confirmed! +2 points earned.");
      setLoading(false);
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    if (!initialToken) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      submitToken(initialToken).catch((unknownError) => {
        console.error(unknownError);
        setError("Auto check-in failed. Please try scanning again.");
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialToken, submitToken]);

  useEffect(() => {
    if (!scanning) {
      return;
    }

    let isMounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!isMounted) {
          return;
        }

        const scanner = new Html5Qrcode(SCANNER_REGION_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          async (decodedText) => {
            setTokenInput(decodedText);
            setScanning(false);
            await submitToken(decodedText);
          },
          () => {
            return;
          },
        );
      } catch (scannerError) {
        console.error(scannerError);
        setError("Could not access camera. You can still enter token manually.");
        setScanning(false);
      }
    }

    startScanner().catch((unknownError) => {
      console.error(unknownError);
      setError("Scanner initialization failed.");
      setScanning(false);
    });

    return () => {
      isMounted = false;

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => undefined)
          .finally(() => {
            if (scannerRef.current) {
              Promise.resolve(scannerRef.current.clear()).catch(() => undefined);
              scannerRef.current = null;
            }
          });
      }
    };
  }, [scanning, submitToken]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-club-surface/85 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-400/10 blur-3xl"
      />
      <div className="relative flex items-start gap-3">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/35 bg-gradient-to-br from-red-500/25 to-red-800/10 text-red-100 shadow-[0_0_22px_rgba(220,38,38,0.22)]">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-2xl uppercase leading-none tracking-[0.04em] text-white">
            QR Attendance Check-In
          </h2>
          <p className="mt-1 text-sm text-club-muted">
            Scan the session QR code or paste the token manually.
          </p>
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        <label className="space-y-2 block">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
            Session Token
          </span>
          <input
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            className="cn-input"
            placeholder="Paste QR token"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => submitToken(tokenInput)}
            disabled={loading}
            className="cn-btn cn-btn-primary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
            Mark Attendance
          </button>

          <button
            type="button"
            onClick={() => setScanning((prev) => !prev)}
            className="cn-btn cn-btn-ghost"
          >
            <Camera className="h-4 w-4" />
            {scanning ? "Stop Camera" : "Open Scanner"}
          </button>
        </div>

        {message && !rewardDetails ? (
          <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-red-200">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-rose-300">
            {error}
          </p>
        ) : null}
        {rewardDetails ? (
          <article className="relative overflow-hidden rounded-2xl border border-red-300/35 bg-gradient-to-br from-red-500/15 via-red-700/10 to-black/30 p-4 shadow-[0_14px_32px_rgba(5,45,26,0.45)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/40 to-transparent"
            />
            <p className="font-heading text-lg uppercase tracking-[0.04em] text-red-50">
              +{rewardDetails.pointsAwarded} points earned
            </p>
            <p className="mt-1 text-sm text-red-100/80">
              Attendance confirmed. Your rank metrics just updated.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-red-300/25 bg-black/25 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-200/75">
                  Total points
                </p>
                <p className="mt-0.5 font-heading text-xl text-white">
                  {rewardDetails.totalPoints}
                </p>
              </div>
              <div className="rounded-lg border border-red-300/25 bg-black/25 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-200/75">
                  Attendance count
                </p>
                <p className="mt-0.5 font-heading text-xl text-white">
                  {rewardDetails.attendanceCount}
                </p>
              </div>
              <div className="rounded-lg border border-red-300/25 bg-black/25 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-200/75">
                  Current streak
                </p>
                <p className="mt-0.5 font-heading text-xl text-white">
                  {rewardDetails.currentStreak}
                </p>
              </div>
              <div className="rounded-lg border border-red-300/25 bg-black/25 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-200/75">
                  Current rank
                </p>
                <p className="mt-0.5 font-heading text-xl text-white">
                  {rewardDetails.currentRank
                    ? `#${rewardDetails.currentRank}`
                    : "—"}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-red-200/80">
                  {rewardDetails.trend === "up"
                    ? `↑ Up ${rewardDetails.rankChange}`
                    : rewardDetails.trend === "down"
                      ? `↓ Down ${Math.abs(rewardDetails.rankChange)}`
                      : "— Steady"}
                </p>
              </div>
            </div>
          </article>
        ) : null}
      </div>

      {scanning ? (
        <div
          id={SCANNER_REGION_ID}
          className="relative mt-4 overflow-hidden rounded-2xl border border-red-300/30 bg-black/40 shadow-[0_0_28px_rgba(220,38,38,0.18)]"
        />
      ) : null}
    </section>
  );
}
