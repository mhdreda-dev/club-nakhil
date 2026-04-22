import {
  CommunityPostStatus,
  CommunityPostType,
  Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  communityPostInclude,
  isCommunityModeratorRole,
  serializeCommunityPost,
} from "@/features/community/community.dto";
import { communityModerationActionSchema } from "@/features/community/community.schemas";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  if (!isCommunityModeratorRole(auth.session.user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { postId } = await context.params;

  try {
    const body = await request.json();
    const parsed = communityModerationActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid moderation payload.",
        },
        { status: 400 },
      );
    }

    const existingPost = await prisma.communityPost.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        status: true,
        postType: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    if (existingPost.status === CommunityPostStatus.DELETED) {
      return NextResponse.json(
        {
          message: "This post is already deleted.",
        },
        { status: 400 },
      );
    }

    if (
      parsed.data.action === "PIN" &&
      existingPost.postType !== CommunityPostType.ACHIEVEMENT
    ) {
      return NextResponse.json(
        {
          message: "Only achievement posts can be pinned.",
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const updateData: Prisma.CommunityPostUpdateInput = {
      moderatedBy: {
        connect: {
          id: auth.session.user.id,
        },
      },
      moderatedAt: now,
    };

    let message = "Post updated.";

    if (parsed.data.action === "HIDE") {
      updateData.status = CommunityPostStatus.HIDDEN;
      updateData.pinnedByCoach = false;
      message = "Post hidden successfully.";
    }

    if (parsed.data.action === "DELETE") {
      updateData.status = CommunityPostStatus.DELETED;
      updateData.pinnedByCoach = false;
      message = "Post deleted successfully.";
    }

    if (parsed.data.action === "PIN") {
      updateData.pinnedByCoach = true;
      if (existingPost.status === CommunityPostStatus.HIDDEN) {
        updateData.status = CommunityPostStatus.VISIBLE;
      }
      message = "Achievement pinned successfully.";
    }

    if (parsed.data.action === "UNPIN") {
      updateData.pinnedByCoach = false;
      message = "Post unpinned successfully.";
    }

    const updatedPost = await prisma.communityPost.update({
      where: {
        id: existingPost.id,
      },
      data: updateData,
      include: communityPostInclude,
    });

    return NextResponse.json({
      message,
      post: serializeCommunityPost(updatedPost, auth.session.user.id),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to update post moderation.",
      },
      { status: 500 },
    );
  }
}
