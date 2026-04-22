import {
  CommunityPostStatus,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isCommunityModeratorRole } from "@/features/community/community.dto";
import { communityCommentCreateSchema } from "@/features/community/community.schemas";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const { postId } = await context.params;

  try {
    const body = await request.json();
    const parsed = communityCommentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? "Invalid comment payload.",
        },
        { status: 400 },
      );
    }

    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    if (post.status === CommunityPostStatus.DELETED) {
      return NextResponse.json(
        {
          message: "This post is no longer available.",
        },
        { status: 400 },
      );
    }

    if (
      post.status === CommunityPostStatus.HIDDEN &&
      !isCommunityModeratorRole(auth.session.user.role)
    ) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId: post.id,
        authorId: auth.session.user.id,
        content: parsed.data.text,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            fullName: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const authorName =
      comment.author.profile?.displayName ??
      comment.author.fullName ??
      comment.author.name;

    return NextResponse.json(
      {
        message: "Comment posted.",
        comment: {
          id: comment.id,
          authorName,
          authorAvatar: comment.author.profile?.avatarUrl ?? null,
          text: comment.content,
          createdAt: comment.createdAt.getTime(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to post comment.",
      },
      { status: 500 },
    );
  }
}
