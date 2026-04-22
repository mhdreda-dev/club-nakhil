import { z } from "zod";

export const attendanceScanSchema = z.object({
  qrToken: z.string().trim().min(6).max(180),
});

export type AttendanceScanInput = z.infer<typeof attendanceScanSchema>;
