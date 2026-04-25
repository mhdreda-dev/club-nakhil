import { cache } from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

// React cache() dedupes the call within a single render pass, so the layout +
// page + nested server components all share one session resolution per request
// instead of triggering NextAuth's JWT callback (and its DB hit) multiple times.
export const getAuthSession = cache(async () => {
  return getServerSession(authOptions);
});
