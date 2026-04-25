import {
  CommunityPostStatus,
  CommunityReactionType,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isCommunityModeratorRole } from "@/features/community/community.dto";
import {
  communityReactionToggleSchema,
  reactionTypeFromKey,
} from "@/features/community/community.schemas";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

function emptyReactionCounts() {
  return {
    like: 0,
    fire: 0,
    clap: 0,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const { postId } = await context.params;

  try {
    const body = await request.json();
    const parsed = communityReactionToggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid reaction payload." }, { status: 400 });
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

    const reactionType = reactionTypeFromKey(parsed.data.reaction);

    // PgBouncer-safe reaction toggle:
    //   1. Resolve current state with a single read.
    //   2. Issue the toggle write + the regroup count in an array-form
    //      `$transaction([...])`. Array transactions are translated into one
    //      BEGIN/…/COMMIT block on a single connection — no interactive
    //      callback, no idle waits, fully supported by PgBouncer transaction
    //      mode. This avoids the "Transaction API error: Unable to start a
    //      transaction in the given time" failure pattern.
    const existingReaction = await prisma.communityReaction.findUnique({
      where: {
        postId_userId_reactionType: {
          postId: post.id,
          userId: auth.session.user.id,
          reactionType,
        },
      },
      select: {
        id: true,
      },
    });

    const reacted = !existingReaction;

    const toggleOp = existingReaction
      ? prisma.communityReaction.delete({
          where: {
            id: existingReaction.id,
          },
        })
      : prisma.communityReaction.create({
          data: {
            postId: post.id,
            userId: auth.session.user.id,
            reactionType,
          },
        });

    const groupOp = prisma.communityReaction.groupBy({
      by: ["reactionType"],
      where: {
        postId: post.id,
      },
      _count: {
        _all: true,
      },
    });

    const [, grouped] = await prisma.$transaction([toggleOp, groupOp]);

    const reactions = emptyReactionCounts();

    for (const row of grouped) {
      if (row.reactionType === CommunityReactionType.LIKE) {
        reactions.like = row._count._all;
        continue;
      }

      if (row.reactionType === CommunityReactionType.FIRE) {
        reactions.fire = row._count._all;
        continue;
      }

      reactions.clap = row._count._all;
    }

    const reactionSummary = { reactions, reacted };

    return NextResponse.json({
      message: "Reaction updated.",
      reaction: parsed.data.reaction,
      reacted: reactionSummary.reacted,
      reactions: reactionSummary.reactions,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to update reaction.",
      },
      { status: 500 },
    );
  }
}
