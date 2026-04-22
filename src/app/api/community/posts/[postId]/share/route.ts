import { CommunityPostStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isCommunityModeratorRole } from "@/features/community/community.dto";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const { postId } = await context.params;

  const existingPost = await prisma.communityPost.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existingPost) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  if (existingPost.status === CommunityPostStatus.DELETED) {
    return NextResponse.json(
      {
        message: "This post is no longer available.",
      },
      { status: 400 },
    );
  }

  if (
    existingPost.status === CommunityPostStatus.HIDDEN &&
    !isCommunityModeratorRole(auth.session.user.role)
  ) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  const post = await prisma.communityPost.update({
    where: {
      id: existingPost.id,
    },
    data: {
      shareCount: {
        increment: 1,
      },
    },
    select: {
      shareCount: true,
    },
  });

  return NextResponse.json({
    message: "Post shared.",
    shareCount: post.shareCount,
  });
}
