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

    const reactionSummary = await prisma.$transaction(async (tx) => {
      const existingReaction = await tx.communityReaction.findUnique({
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

      let reacted = false;

      if (existingReaction) {
        await tx.communityReaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      } else {
        await tx.communityReaction.create({
          data: {
            postId: post.id,
            userId: auth.session.user.id,
            reactionType,
          },
        });

        reacted = true;
      }

      const grouped = await tx.communityReaction.groupBy({
        by: ["reactionType"],
        where: {
          postId: post.id,
        },
        _count: {
          _all: true,
        },
      });

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

      return {
        reactions,
        reacted,
      };
    });

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
