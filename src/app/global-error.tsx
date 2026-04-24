"use client";

/**
 * App Router root error boundary.
 *
 * This file is required for Sentry to capture crashes in the root layout
 * itself (anything that bypasses segment-level `error.tsx`). It wraps its
 * own <html>/<body> because the default layout can't render when there's
 * an error at the root.
 */
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` renders Next.js' default 500 page. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
