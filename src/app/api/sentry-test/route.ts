/**
 * Temporary smoke-test endpoint for Sentry.
 *
 * Guarded so it only runs in development — safe to delete once you've
 * confirmed events are arriving in Sentry.
 *
 *   GET /api/sentry-test          -> throws server error (server SDK)
 *   GET /api/sentry-test?msg=hi   -> sends a manual message event
 */
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const message = request.nextUrl.searchParams.get("msg");

  if (message) {
    Sentry.captureMessage(`sentry-test: ${message}`, "info");
    await Sentry.flush(2000);
    return NextResponse.json({ ok: true, sent: "message", message });
  }

  // Throw so `onRequestError` + the server SDK both pick it up.
  throw new Error("Sentry server-side smoke test — safe to ignore");
}
