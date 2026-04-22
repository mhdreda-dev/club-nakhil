import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { attendanceScanSchema } from "@/features/attendance/attendance.schemas";
import {
  AttendanceAlreadyMarkedError,
  AttendanceSessionNotFoundError,
  scanAttendanceAndReward,
} from "@/features/attendance/attendance.service";
import { requireApiAuth } from "@/lib/route-auth";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(Role.MEMBER);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = attendanceScanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid QR payload",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.map((segment) => String(segment)),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const result = await scanAttendanceAndReward(auth.session.user.id, parsed.data.qrToken);

    return NextResponse.json({
      success: true,
      message: `Attendance confirmed! +${result.pointsAwarded} points earned`,
      data: result,
    });
  } catch (error) {
    if (error instanceof AttendanceAlreadyMarkedError) {
      return NextResponse.json(
        {
          message: "Attendance already marked for this session",
        },
        { status: 409 },
      );
    }

    if (error instanceof AttendanceSessionNotFoundError) {
      return NextResponse.json({ message: "QR code not recognized" }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ message: "Unable to process attendance" }, { status: 500 });
  }
}
