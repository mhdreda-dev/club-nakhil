import {
  CommunityPostStatus,
  CommunityPostType,
  Role,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  COMMUNITY_POST_IMAGE_UPLOAD_FIELD,
} from "@/features/community/community.constants";
import {
  communityPostInclude,
  isCommunityModeratorRole,
  serializeCommunityPost,
} from "@/features/community/community.dto";
import {
  removeCommunityPostImage,
  uploadCommunityPostImage,
} from "@/features/community/community-media.repository";
import {
  buildCommunityPostImagePath,
  categoryFromPostType,
  communityPostCreateSchema,
  validateCommunityPostImage,
} from "@/features/community/community.schemas";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

export const runtime = "nodejs";

function mapIssuesToFieldErrors(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>,
) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");

    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const role = auth.session.user.role;
  const includeHiddenRequested = request.nextUrl.searchParams.get("includeHidden");
  const includeHidden =
    includeHiddenRequested === "1" || includeHiddenRequested === "true";
  const canIncludeHidden = includeHidden && isCommunityModeratorRole(role);

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 40);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), 100)
    : 40;

  const where = canIncludeHidden
    ? {
        status: {
          in: [CommunityPostStatus.VISIBLE, CommunityPostStatus.HIDDEN],
        },
      }
    : {
        status: CommunityPostStatus.VISIBLE,
      };

  const posts = await prisma.communityPost.findMany({
    where,
    include: communityPostInclude,
    orderBy: [{ pinnedByCoach: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({
    posts: posts.map((post) => serializeCommunityPost(post, auth.session.user.id)),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(Role.MEMBER);
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();

    const parsed = communityPostCreateSchema.safeParse({
      postType: formData.get("postType"),
      caption: formData.get("caption"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please correct the post fields.",
          fieldErrors: mapIssuesToFieldErrors(parsed.error.issues),
        },
        { status: 400 },
      );
    }

    const imageField = formData.get(COMMUNITY_POST_IMAGE_UPLOAD_FIELD);
    const imageFile =
      imageField instanceof File && imageField.size > 0 ? imageField : null;

    if (parsed.data.postType === CommunityPostType.PHOTO && !imageFile) {
      return NextResponse.json(
        {
          message: "A photo is required for training selfie posts.",
          fieldErrors: {
            image: "Please add a training selfie or gym photo.",
          },
        },
        { status: 400 },
      );
    }

    if (imageFile) {
      const parsedImage = validateCommunityPostImage(imageFile);

      if (!parsedImage.success) {
        return NextResponse.json(
          {
            message: "Invalid post image.",
            fieldErrors: {
              image: parsedImage.error.issues[0]?.message ?? "Invalid image file.",
            },
          },
          { status: 400 },
        );
      }
    }

    let imagePath: string | null = null;
    let imageUrl: string | null = null;

    if (imageFile) {
      imagePath = buildCommunityPostImagePath(auth.session.user.id, imageFile.type);
      imageUrl = await uploadCommunityPostImage({
        path: imagePath,
        data: await imageFile.arrayBuffer(),
        contentType: imageFile.type,
      });
    }

    try {
      const createdPost = await prisma.communityPost.create({
        data: {
          authorId: auth.session.user.id,
          postType: parsed.data.postType,
          category: categoryFromPostType(parsed.data.postType),
          caption: parsed.data.caption,
          imagePath,
          imageUrl,
          status: CommunityPostStatus.VISIBLE,
        },
        include: communityPostInclude,
      });

      return NextResponse.json(
        {
          message: "Post shared with the community.",
          post: serializeCommunityPost(createdPost, auth.session.user.id),
        },
        { status: 201 },
      );
    } catch (createError) {
      if (imagePath) {
        removeCommunityPostImage(imagePath).catch((cleanupError) => {
          console.error("Community post image cleanup warning:", cleanupError);
        });
      }

      throw createError;
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to create community post.",
      },
      { status: 500 },
    );
  }
}
