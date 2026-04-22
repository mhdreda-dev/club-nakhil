import {
  CommunityPostStatus,
  CommunityReactionType,
  Prisma,
  Role,
} from "@prisma/client";

export const communityPostInclude = {
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
  comments: {
    orderBy: {
      createdAt: "asc",
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
  },
  reactions: {
    select: {
      reactionType: true,
      userId: true,
    },
  },
} satisfies Prisma.CommunityPostInclude;

type CommunityPostWithRelations = Prisma.CommunityPostGetPayload<{
  include: typeof communityPostInclude;
}>;

function nameFromUser(user: {
  name: string;
  fullName: string | null;
  profile: { displayName: string } | null;
}) {
  return user.profile?.displayName ?? user.fullName ?? user.name;
}

function communityReactionCounts() {
  return {
    like: 0,
    fire: 0,
    clap: 0,
  };
}

function communityReactedState() {
  return {
    like: false,
    fire: false,
    clap: false,
  };
}

export function isCommunityModeratorRole(role: Role) {
  return role === Role.ADMIN || role === Role.COACH;
}

export function serializeCommunityPost(post: CommunityPostWithRelations, viewerId: string) {
  const reactions = communityReactionCounts();
  const reacted = communityReactedState();

  for (const reaction of post.reactions) {
    if (reaction.reactionType === CommunityReactionType.LIKE) {
      reactions.like += 1;
      if (reaction.userId === viewerId) reacted.like = true;
      continue;
    }

    if (reaction.reactionType === CommunityReactionType.FIRE) {
      reactions.fire += 1;
      if (reaction.userId === viewerId) reacted.fire = true;
      continue;
    }

    reactions.clap += 1;
    if (reaction.userId === viewerId) reacted.clap = true;
  }

  return {
    id: post.id,
    postType: post.postType,
    category: post.category,
    caption: post.caption,
    imageUrl: post.imageUrl,
    status: post.status,
    hidden: post.status === CommunityPostStatus.HIDDEN || post.status === CommunityPostStatus.DELETED,
    pinnedByCoach: post.pinnedByCoach,
    shareCount: post.shareCount,
    createdAt: post.createdAt.getTime(),
    author: {
      id: post.author.id,
      name: nameFromUser(post.author),
      avatarUrl: post.author.profile?.avatarUrl ?? null,
    },
    comments: post.comments.map((comment) => ({
      id: comment.id,
      author: {
        id: comment.author.id,
        name: nameFromUser(comment.author),
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
      },
      text: comment.content,
      createdAt: comment.createdAt.getTime(),
    })),
    reactions,
    reacted,
  };
}
