"use client";

import {
  CalendarClock,
  Camera,
  Flame,
  Hand,
  Heart,
  Loader2,
  Megaphone,
  MessageCircle,
  Pin,
  PinOff,
  Quote,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  Swords,
  Timer,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SectionHeader } from "@/components/sports/section-header";
import { useTranslations } from "@/components/providers/translations-provider";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { getIntlLocale, type MessageKey, type Translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ViewerRole = "ADMIN" | "COACH" | "MEMBER";
type FeedFilter = "ALL" | "ACHIEVEMENTS" | "TRAINING" | "MATCHES" | "COACH_POSTS" | "EVENTS";
type ReactionKey = "like" | "fire" | "clap";
type CommunityPostType = "PHOTO" | "ACHIEVEMENT" | "TEXT" | "SUPPORT";
type TagTone = "green" | "gold" | "slate" | "cyan" | "rose";

type CommentItem = {
  id: string;
  authorName: string;
  text: string;
  createdAt: number;
};

type Engagement = {
  reactions: Record<ReactionKey, number>;
  reacted: Record<ReactionKey, boolean>;
  comments: CommentItem[];
  shareCount: number;
};

type OfficialPostKind =
  | "ACHIEVEMENT"
  | "TRAINING"
  | "MATCH"
  | "ANNOUNCEMENT"
  | "MOTIVATION"
  | "EVENT"
  | "PROGRESS";

type OfficialPost = Engagement & {
  id: string;
  source: "OFFICIAL";
  kind: OfficialPostKind;
  category: Exclude<FeedFilter, "ALL">;
  createdAt: number;
  actorName?: string;
  actorAvatar?: string;
  title: string;
  description?: string;
  membersAttended?: number;
  duration?: string;
  score?: string;
  mvpPlayer?: string;
  quote?: string;
  eventDate?: string;
  countdown?: string;
  sessionsCompleted?: number;
  pointsEarned?: number;
  pinned?: boolean;
};

type CommunityPost = Engagement & {
  id: string;
  source: "COMMUNITY";
  category: Exclude<FeedFilter, "ALL">;
  createdAt: number;
  authorName: string;
  authorAvatar?: string | null;
  postType: CommunityPostType;
  caption: string;
  imageUrl?: string;
  pinnedByCoach?: boolean;
  hidden?: boolean;
};

type ActivityPost = OfficialPost | CommunityPost;

type ActivityFeedBoardProps = {
  viewerRole?: ViewerRole;
  userName?: string;
  userAvatar?: string | null;
};

type CommunityApiComment = {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  text: string;
  createdAt: number;
};

type CommunityApiPost = {
  id: string;
  postType: CommunityPostType;
  category: Exclude<FeedFilter, "ALL">;
  caption: string;
  imageUrl: string | null;
  status: "VISIBLE" | "HIDDEN" | "DELETED";
  hidden: boolean;
  pinnedByCoach: boolean;
  shareCount: number;
  createdAt: number;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  comments: CommunityApiComment[];
  reactions: Record<ReactionKey, number>;
  reacted: Record<ReactionKey, boolean>;
};

type CommunityPostsResponse = {
  posts: CommunityApiPost[];
};

type ModerationAction = "HIDE" | "DELETE" | "PIN" | "UNPIN";

const filters: Array<{ id: FeedFilter; labelKey: MessageKey }> = [
  { id: "ALL", labelKey: "activityFeed.filters.all" },
  { id: "ACHIEVEMENTS", labelKey: "activityFeed.filters.achievements" },
  { id: "TRAINING", labelKey: "activityFeed.filters.training" },
  { id: "MATCHES", labelKey: "activityFeed.filters.matches" },
  { id: "COACH_POSTS", labelKey: "activityFeed.filters.coachPosts" },
  { id: "EVENTS", labelKey: "activityFeed.filters.events" }
];

function minutesAgo(value: number) {
  return Date.now() - value * 60 * 1000;
}

function hoursAgo(value: number) {
  return Date.now() - value * 60 * 60 * 1000;
}

function daysAgo(value: number) {
  return Date.now() - value * 24 * 60 * 60 * 1000;
}

function buildOfficialDemoPosts(t: Translate): OfficialPost[] {
  const coachName = `${t("roles.coach")} Rabah`;

  return [
    {
      id: "official-achievement-rank-1",
      source: "OFFICIAL",
      kind: "ACHIEVEMENT",
      category: "ACHIEVEMENTS",
      actorName: "Ayoub El Idrissi",
      actorAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
      title: t("activityFeed.demo.achievementRank1.title"),
      description: t("activityFeed.demo.achievementRank1.description"),
      createdAt: minutesAgo(24),
      reactions: { like: 48, fire: 33, clap: 29 },
      reacted: { like: false, fire: true, clap: false },
      comments: [
        {
          id: "c1",
          authorName: "Salma",
          text: t("activityFeed.demo.achievementRank1.comment1"),
          createdAt: minutesAgo(20),
        },
        {
          id: "c2",
          authorName: coachName,
          text: t("activityFeed.demo.achievementRank1.comment2"),
          createdAt: minutesAgo(14),
        },
      ],
      shareCount: 6,
    },
    {
      id: "official-training-elite",
      source: "OFFICIAL",
      kind: "TRAINING",
      category: "TRAINING",
      actorName: coachName,
      actorAvatar:
        "https://images.unsplash.com/photo-1541534401786-2077eed87a72?w=300&q=80",
      title: t("activityFeed.demo.trainingElite.title"),
      description: t("activityFeed.demo.trainingElite.description"),
      membersAttended: 14,
      duration: "01h 35m",
      createdAt: hoursAgo(1),
      reactions: { like: 31, fire: 24, clap: 15 },
      reacted: { like: true, fire: false, clap: false },
      comments: [
        {
          id: "c3",
          authorName: "Nour",
          text: t("activityFeed.demo.trainingElite.comment"),
          createdAt: minutesAgo(55),
        },
      ],
      shareCount: 4,
    },
    {
      id: "official-match-result",
      source: "OFFICIAL",
      kind: "MATCH",
      category: "MATCHES",
      title: t("activityFeed.demo.matchResult.title"),
      description: t("activityFeed.demo.matchResult.description"),
      score: "3 - 1",
      mvpPlayer: "Salma Naji",
      createdAt: daysAgo(1),
      reactions: { like: 62, fire: 44, clap: 28 },
      reacted: { like: false, fire: true, clap: true },
      comments: [
        {
          id: "c4",
          authorName: "Hamza",
          text: t("activityFeed.demo.matchResult.comment"),
          createdAt: hoursAgo(22),
        },
      ],
      shareCount: 11,
    },
    {
      id: "official-announcement",
      source: "OFFICIAL",
      kind: "ANNOUNCEMENT",
      category: "COACH_POSTS",
      actorName: coachName,
      actorAvatar:
        "https://images.unsplash.com/photo-1541534401786-2077eed87a72?w=300&q=80",
      title: t("activityFeed.demo.announcement.title"),
      description: t("activityFeed.demo.announcement.description"),
      pinned: true,
      createdAt: hoursAgo(2),
      reactions: { like: 39, fire: 14, clap: 21 },
      reacted: { like: false, fire: false, clap: false },
      comments: [
        {
          id: "c5",
          authorName: "Ayoub",
          text: t("activityFeed.demo.announcement.comment"),
          createdAt: hoursAgo(1),
        },
      ],
      shareCount: 7,
    },
    {
      id: "official-motivation",
      source: "OFFICIAL",
      kind: "MOTIVATION",
      category: "COACH_POSTS",
      title: t("activityFeed.demo.motivation.title"),
      quote: t("activityFeed.demo.motivation.quote"),
      description: t("activityFeed.demo.motivation.description"),
      createdAt: hoursAgo(5),
      reactions: { like: 52, fire: 20, clap: 41 },
      reacted: { like: false, fire: false, clap: true },
      comments: [
        {
          id: "c6",
          authorName: "Nour",
          text: t("activityFeed.demo.motivation.comment"),
          createdAt: hoursAgo(4),
        },
      ],
      shareCount: 8,
    },
    {
      id: "official-event",
      source: "OFFICIAL",
      kind: "EVENT",
      category: "EVENTS",
      title: t("activityFeed.demo.event.title"),
      description: t("activityFeed.demo.event.description"),
      eventDate: t("activityFeed.demo.event.eventDate"),
      countdown: t("activityFeed.demo.event.countdown"),
      createdAt: hoursAgo(8),
      reactions: { like: 34, fire: 27, clap: 14 },
      reacted: { like: false, fire: false, clap: false },
      comments: [],
      shareCount: 3,
    },
    {
      id: "official-progress",
      source: "OFFICIAL",
      kind: "PROGRESS",
      category: "TRAINING",
      title: t("activityFeed.demo.progress.title"),
      description: t("activityFeed.demo.progress.description"),
      sessionsCompleted: 3,
      pointsEarned: 12,
      createdAt: hoursAgo(3),
      reactions: { like: 22, fire: 10, clap: 16 },
      reacted: { like: false, fire: false, clap: false },
      comments: [],
      shareCount: 2,
    },
  ];
}

function mapCommunityApiPostToLocal(post: CommunityApiPost): CommunityPost {
  return {
    id: post.id,
    source: "COMMUNITY",
    postType: post.postType,
    category: post.category,
    authorName: post.author.name,
    authorAvatar: post.author.avatarUrl,
    caption: post.caption,
    imageUrl: post.imageUrl ?? undefined,
    pinnedByCoach: post.pinnedByCoach,
    hidden: post.hidden,
    createdAt: post.createdAt,
    reactions: post.reactions,
    reacted: post.reacted,
    comments: post.comments.map((comment) => ({
      id: comment.id,
      authorName: comment.author.name,
      text: comment.text,
      createdAt: comment.createdAt,
    })),
    shareCount: post.shareCount,
  };
}

function formatRelativeTime(createdAt: number, locale: "en" | "fr" | "ar") {
  const delta = Date.now() - createdAt;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const formatter = new Intl.RelativeTimeFormat(getIntlLocale(locale), {
    numeric: "auto",
  });

  if (delta < minute) {
    return formatter.format(0, "second");
  }

  if (delta < hour) {
    return formatter.format(-Math.max(1, Math.floor(delta / minute)), "minute");
  }

  if (delta < day) {
    return formatter.format(-Math.floor(delta / hour), "hour");
  }

  return formatter.format(-Math.floor(delta / day), "day");
}

function filterPost(post: ActivityPost, activeFilter: FeedFilter) {
  return activeFilter === "ALL" || post.category === activeFilter;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-28 rounded bg-white/10" />
            <div className="h-6 w-3/4 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
            <div className="h-8 w-52 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterTabs({
  activeFilter,
  onSelect,
  t,
  compact = false,
}: {
  activeFilter: FeedFilter;
  onSelect: (filter: FeedFilter) => void;
  t: Translate;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "justify-start" : "justify-end")}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onSelect(filter.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200",
            activeFilter === filter.id
              ? "border-emerald-300/50 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(34,229,132,0.25)]"
              : "border-white/12 bg-white/5 text-club-muted hover:border-emerald-300/35 hover:text-emerald-100",
          )}
        >
          {t(filter.labelKey)}
        </button>
      ))}
    </div>
  );
}

function reactionButtonMeta(
  key: ReactionKey,
  t: Translate,
): { label: string; icon: ReactNode } {
  if (key === "like") {
    return { label: t("activityFeed.reactions.like"), icon: <Heart className="h-3.5 w-3.5" /> };
  }

  if (key === "fire") {
    return { label: t("activityFeed.reactions.fire"), icon: <Flame className="h-3.5 w-3.5" /> };
  }

  return { label: t("activityFeed.reactions.clap"), icon: <Hand className="h-3.5 w-3.5" /> };
}

function ReactionBar({
  post,
  pulseKey,
  onToggleReaction,
  onShare,
  t,
}: {
  post: ActivityPost;
  pulseKey: string | null;
  onToggleReaction: (post: ActivityPost, reaction: ReactionKey) => void;
  onShare: (post: ActivityPost) => void;
  t: Translate;
}) {
  const keys: ReactionKey[] = ["like", "fire", "clap"];

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
      {keys.map((key) => {
        const meta = reactionButtonMeta(key, t);
        const isActive = post.reacted[key];
        const reactionPulseKey = `${post.id}-${key}`;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggleReaction(post, key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-200 active:scale-95",
              isActive
                ? "border-emerald-300/45 bg-emerald-500/15 text-emerald-100"
                : "border-white/15 bg-white/5 text-club-muted hover:border-emerald-300/35 hover:bg-emerald-500/10 hover:text-emerald-100",
              pulseKey === reactionPulseKey ? "cn-reaction-bounce" : "",
            )}
          >
            {meta.icon}
            {meta.label}
            <span>{post.reactions[key]}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onShare(post)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-club-muted transition hover:border-emerald-300/35 hover:text-emerald-100"
      >
        <Share2 className="h-3.5 w-3.5" />
        {t("activityFeed.actions.share")}
        <span>{post.shareCount}</span>
      </button>

      <span className="ms-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-club-muted">
        <MessageCircle className="h-3.5 w-3.5" />
        {t("activityFeed.comments.count", { count: post.comments.length })}
      </span>
    </div>
  );
}

function CommentsPanel({
  post,
  draft,
  onDraft,
  onSubmit,
  locale,
  t,
}: {
  post: ActivityPost;
  draft: string;
  onDraft: (value: string) => void;
  onSubmit: () => void;
  locale: "en" | "fr" | "ar";
  t: Translate;
}) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="space-y-2">
        {post.comments.slice(-3).map((comment) => (
          <div key={comment.id} className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
            <p className="text-xs font-semibold text-white">{comment.authorName}</p>
            <p className="mt-0.5 text-xs text-club-text-soft">{comment.text}</p>
            <p className="mt-1 text-[10px] text-club-muted">
              {formatRelativeTime(comment.createdAt, locale)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          className="cn-input h-9 px-3 text-sm"
          placeholder={t("activityFeed.comments.placeholder")}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="cn-btn cn-btn-primary !h-9 !px-3 !py-0 text-xs"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function communityTypeMeta(
  type: CommunityPostType,
  t: Translate,
): { label: string; tone: TagTone } {
  if (type === "PHOTO") {
    return { label: t("activityFeed.community.postTypes.photo"), tone: "cyan" };
  }
  if (type === "ACHIEVEMENT") {
    return { label: t("activityFeed.community.postTypes.achievement"), tone: "gold" };
  }
  if (type === "SUPPORT") {
    return { label: t("activityFeed.community.postTypes.support"), tone: "green" };
  }
  return { label: t("activityFeed.community.postTypes.text"), tone: "slate" };
}

export function ActivityFeedBoard({
  viewerRole = "MEMBER",
  userName,
  userAvatar = null,
}: ActivityFeedBoardProps) {
  const { locale, t } = useTranslations();
  const canModerate = viewerRole === "ADMIN" || viewerRole === "COACH";
  const canCreateCommunityPost = viewerRole === "MEMBER";
  const localizedOfficialDemoPosts = useMemo(() => buildOfficialDemoPosts(t), [t]);
  const resolvedUserName = userName ?? t("sports.leaderboard.memberFallback");

  const [activeFilter, setActiveFilter] = useState<FeedFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const [officialPosts, setOfficialPosts] = useState<OfficialPost[]>(localizedOfficialDemoPosts);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [pulseKey, setPulseKey] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [composerType, setComposerType] = useState<"PHOTO" | "ACHIEVEMENT" | "TEXT">("TEXT");
  const [supportMode, setSupportMode] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [composerImageUrl, setComposerImageUrl] = useState<string | null>(null);
  const [composerImageFile, setComposerImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [moderationAction, setModerationAction] = useState<{
    postId: string;
    action: ModerationAction;
  } | null>(null);

  useEffect(() => {
    setOfficialPosts(localizedOfficialDemoPosts);
  }, [localizedOfficialDemoPosts]);

  const loadCommunityPosts = useCallback(async () => {
    setIsLoading(true);
    setFeedError(null);
    setPostError(null);

    try {
      const query = canModerate ? "?includeHidden=1" : "";
      const response = await fetch(`/api/community/posts${query}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as
        | CommunityPostsResponse
        | { message?: string };

      if (!response.ok || !("posts" in payload) || !Array.isArray(payload.posts)) {
        setFeedError(
          ("message" in payload && payload.message) || t("activityFeed.errors.loadPosts"),
        );
        setCommunityPosts([]);
        return;
      }

      setCommunityPosts(payload.posts.map(mapCommunityApiPostToLocal));
    } catch (error) {
      console.error(error);
      setFeedError(t("activityFeed.errors.loadPosts"));
      setCommunityPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [canModerate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCommunityPosts();
  }, [loadCommunityPosts]);

  useEffect(() => {
    return () => {
      if (composerImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(composerImageUrl);
      }
    };
  }, [composerImageUrl]);

  function withUpdatedPost(
    post: ActivityPost,
    updater: (current: OfficialPost | CommunityPost) => OfficialPost | CommunityPost,
  ) {
    if (post.source === "OFFICIAL") {
      setOfficialPosts((previous) =>
        previous.map((item) => (item.id === post.id ? (updater(item) as OfficialPost) : item)),
      );
      return;
    }

    setCommunityPosts((previous) =>
      previous.map((item) => (item.id === post.id ? (updater(item) as CommunityPost) : item)),
    );
  }

  async function handleToggleReaction(post: ActivityPost, reaction: ReactionKey) {
    const nextPulseKey = `${post.id}-${reaction}`;
    setPulseKey(nextPulseKey);

    if (post.source === "OFFICIAL") {
      withUpdatedPost(post, (current) => {
        const wasReacted = current.reacted[reaction];

        return {
          ...current,
          reacted: {
            ...current.reacted,
            [reaction]: !wasReacted,
          },
          reactions: {
            ...current.reactions,
            [reaction]: Math.max(0, current.reactions[reaction] + (wasReacted ? -1 : 1)),
          },
        };
      });
    } else {
      try {
        const response = await fetch(`/api/community/posts/${post.id}/reactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reaction }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
          reacted?: boolean;
          reactions?: Record<ReactionKey, number>;
        };

        if (!response.ok) {
          setPostError(payload.message ?? t("activityFeed.errors.updateReaction"));
        } else {
          withUpdatedPost(post, (current) => ({
            ...current,
            reacted: {
              ...current.reacted,
              [reaction]:
                typeof payload.reacted === "boolean"
                  ? payload.reacted
                  : !current.reacted[reaction],
            },
            reactions: payload.reactions ?? current.reactions,
          }));
        }
      } catch (error) {
        console.error(error);
        setPostError(t("activityFeed.errors.updateReaction"));
      }
    }

    setTimeout(() => {
      setPulseKey((value) => (value === nextPulseKey ? null : value));
    }, 340);
  }

  async function handleShare(post: ActivityPost) {
    if (post.source === "OFFICIAL") {
      withUpdatedPost(post, (current) => ({
        ...current,
        shareCount: current.shareCount + 1,
      }));
      return;
    }

    try {
      const response = await fetch(`/api/community/posts/${post.id}/share`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        shareCount?: number;
      };

      if (!response.ok) {
        setPostError(payload.message ?? t("activityFeed.errors.share"));
        return;
      }

      withUpdatedPost(post, (current) => ({
        ...current,
        shareCount:
          typeof payload.shareCount === "number"
            ? payload.shareCount
            : current.shareCount + 1,
      }));
    } catch (error) {
      console.error(error);
      setPostError(t("activityFeed.errors.share"));
    }
  }

  function setDraft(postId: string, value: string) {
    setCommentDrafts((previous) => ({
      ...previous,
      [postId]: value,
    }));
  }

  async function submitComment(post: ActivityPost) {
    const text = (commentDrafts[post.id] ?? "").trim();

    if (!text.length) {
      return;
    }

    if (post.source === "OFFICIAL") {
      const comment: CommentItem = {
        id: crypto.randomUUID(),
        authorName: resolvedUserName,
        text,
        createdAt: Date.now(),
      };

      withUpdatedPost(post, (current) => ({
        ...current,
        comments: [...current.comments, comment],
      }));

      setDraft(post.id, "");
      return;
    }

    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        comment?: {
          id: string;
          authorName: string;
          text: string;
          createdAt: number;
        };
      };

      if (!response.ok || !payload.comment) {
        setPostError(payload.message ?? t("activityFeed.errors.comment"));
        return;
      }

      const comment: CommentItem = {
        id: payload.comment.id,
        authorName: payload.comment.authorName,
        text: payload.comment.text,
        createdAt: payload.comment.createdAt,
      };

      withUpdatedPost(post, (current) => ({
        ...current,
        comments: [...current.comments, comment],
      }));
    } catch (error) {
      console.error(error);
      setPostError(t("activityFeed.errors.comment"));
      return;
    }

    setDraft(post.id, "");
  }

  async function applyModerationAction(post: CommunityPost, action: ModerationAction) {
    if (!canModerate) {
      return;
    }

    setModerationAction({
      postId: post.id,
      action,
    });
    setPostError(null);

    try {
      const response = await fetch(`/api/community/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        post?: CommunityApiPost;
      };

      if (!response.ok) {
        setPostError(payload.message ?? t("activityFeed.errors.moderation"));
        return;
      }

      if (payload.post) {
        const mappedPost = mapCommunityApiPostToLocal(payload.post);
        if (action === "DELETE") {
          setCommunityPosts((previous) =>
            previous.filter((item) => item.id !== post.id),
          );
        } else {
          setCommunityPosts((previous) =>
            previous.map((item) => (item.id === post.id ? mappedPost : item)),
          );
        }
      }
    } catch (error) {
      console.error(error);
      setPostError(t("activityFeed.errors.moderation"));
    } finally {
      setModerationAction(null);
    }
  }

  function handleComposerImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setComposerImageFile(null);
      setComposerImageUrl(null);
      return;
    }

    if (composerImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(composerImageUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setComposerImageFile(file);
    setComposerImageUrl(objectUrl);
  }

  async function createCommunityPost() {
    if (!canCreateCommunityPost) {
      setPostError(t("activityFeed.community.onlyMembers"));
      return;
    }

    setPostError(null);

    const caption = composerText.trim();
    const needsImage = composerType === "PHOTO";

    if (!caption.length) {
      setPostError(t("activityFeed.community.errors.caption"));
      return;
    }

    if (needsImage && !composerImageFile) {
      setPostError(t("activityFeed.community.errors.imageRequired"));
      return;
    }

    setIsPosting(true);

    const postType: CommunityPostType =
      composerType === "ACHIEVEMENT"
        ? "ACHIEVEMENT"
        : composerType === "PHOTO"
          ? "PHOTO"
          : supportMode
            ? "SUPPORT"
            : "TEXT";

    try {
      const formData = new FormData();
      formData.set("postType", postType);
      formData.set("caption", caption);

      if (composerImageFile) {
        formData.set("image", composerImageFile);
      }

      const response = await fetch("/api/community/posts", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        post?: CommunityApiPost;
        fieldErrors?: {
          image?: string;
        };
      };

      if (!response.ok || !payload.post) {
        setPostError(
          payload.fieldErrors?.image ??
            payload.message ??
            t("activityFeed.community.errors.publish"),
        );
        return;
      }

      const mappedPost = mapCommunityApiPostToLocal(payload.post);
      setCommunityPosts((previous) => [mappedPost, ...previous]);
      setComposerText("");
      setComposerImageFile(null);
      setComposerImageUrl(null);
      setSupportMode(false);
      setComposerType("TEXT");
    } catch (error) {
      console.error(error);
      setPostError(t("activityFeed.community.errors.publish"));
    } finally {
      setIsPosting(false);
    }
  }

  const visibleOfficialPosts = useMemo(
    () => officialPosts.filter((post) => filterPost(post, activeFilter)),
    [officialPosts, activeFilter],
  );

  const visibleCommunityPosts = useMemo(() => {
    const filtered = communityPosts
      .filter((post) => (canModerate ? true : !post.hidden))
      .filter((post) => filterPost(post, activeFilter));

    return filtered.sort((left, right) => {
      if (left.pinnedByCoach !== right.pinnedByCoach) {
        return left.pinnedByCoach ? -1 : 1;
      }

      return right.createdAt - left.createdAt;
    });
  }, [communityPosts, activeFilter, canModerate]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("activityFeed.section.eyebrow")}
        title={t("activityFeed.section.title")}
        subtitle={t("activityFeed.section.subtitle")}
        action={
          <div className="hidden md:block">
            <FilterTabs activeFilter={activeFilter} onSelect={setActiveFilter} t={t} />
          </div>
        }
      />

      <div className="sticky top-20 z-30 -mx-1 rounded-xl border border-white/10 bg-club-base/85 p-2 backdrop-blur-xl md:hidden">
        <FilterTabs activeFilter={activeFilter} onSelect={setActiveFilter} compact t={t} />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">
                {t("activityFeed.official.title")}
              </h3>
              <Tag label={t("activityFeed.official.tag")} tone="slate" />
            </div>

            {visibleOfficialPosts.length === 0 ? (
              <Card className="border-dashed border-white/15 bg-black/20 py-10 text-center">
                <p className="text-sm text-club-muted">{t("activityFeed.empty")}</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {visibleOfficialPosts.map((post, index) => {
                  if (post.kind === "ACHIEVEMENT") {
                    return (
                      <Card
                        key={post.id}
                        className="cn-feed-stagger overflow-hidden border-amber-300/35 bg-[linear-gradient(145deg,rgba(245,200,101,0.16),rgba(10,16,26,0.92)_48%,rgba(34,229,132,0.08))] shadow-[0_24px_60px_rgba(0,0,0,0.45)] hover:-translate-y-1 hover:shadow-[0_32px_70px_rgba(34,229,132,0.2)]"
                        style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                      >
                        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
                        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl" />

                        <div className="relative flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={post.actorName ?? t("roles.member")} avatarUrl={post.actorAvatar} size="md" />
                            <div>
                              <p className="text-sm font-semibold text-white">{post.actorName}</p>
                              <p className="text-xs text-club-muted">{formatRelativeTime(post.createdAt, locale)}</p>
                            </div>
                          </div>
                          <Tag label={t("activityFeed.official.badges.gold")} tone="gold" />
                        </div>

                        <h3 className="mt-4 font-heading text-2xl uppercase tracking-[0.05em] text-white">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm text-club-text-soft">{post.description}</p>

                        <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                        <CommentsPanel
                          post={post}
                          draft={commentDrafts[post.id] ?? ""}
                          onDraft={(value) => setDraft(post.id, value)}
                          onSubmit={() => submitComment(post)}
                          locale={locale}
                          t={t}
                        />
                      </Card>
                    );
                  }

                  if (post.kind === "TRAINING") {
                    return (
                      <Card
                        key={post.id}
                        className="cn-feed-stagger border-emerald-300/25 bg-white/[0.04] backdrop-blur-xl hover:-translate-y-1 hover:border-emerald-300/40"
                        style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={post.actorName ?? t("roles.coach")} avatarUrl={post.actorAvatar} size="md" />
                            <div>
                              <p className="text-sm font-semibold text-white">{post.actorName}</p>
                              <p className="text-xs text-club-muted">{formatRelativeTime(post.createdAt, locale)}</p>
                            </div>
                          </div>
                          <Tag label={t("activityFeed.official.labels.training")} tone="green" />
                        </div>

                        <h3 className="mt-4 text-xl font-semibold text-white">{post.title}</h3>
                        <p className="mt-2 text-sm text-club-text-soft">{post.description}</p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-club-muted">
                            <Users className="h-3.5 w-3.5 text-emerald-200" />
                            {t("activityFeed.official.membersAttended", {
                              count: post.membersAttended ?? 0,
                            })}
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-club-muted">
                            <Timer className="h-3.5 w-3.5 text-emerald-200" />
                            {t("activityFeed.official.duration", { value: post.duration ?? "" })}
                          </div>
                        </div>

                        <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                        <CommentsPanel
                          post={post}
                          draft={commentDrafts[post.id] ?? ""}
                          onDraft={(value) => setDraft(post.id, value)}
                          onSubmit={() => submitComment(post)}
                          locale={locale}
                          t={t}
                        />
                      </Card>
                    );
                  }

                  if (post.kind === "MATCH") {
                    return (
                      <Card
                        key={post.id}
                        className="cn-feed-stagger border-emerald-300/30 bg-[linear-gradient(145deg,rgba(90,216,255,0.08),rgba(10,16,26,0.9)_55%,rgba(34,229,132,0.08))] hover:-translate-y-1"
                        style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                            <Swords className="h-3.5 w-3.5" />
                            {t("activityFeed.official.labels.matchResult")}
                          </div>
                          <Tag label={t("activityFeed.official.labels.win")} tone="green" />
                        </div>

                        <h3 className="mt-4 text-xl font-semibold text-white">{post.title}</h3>
                        <p className="mt-2 text-4xl font-heading font-black tracking-[0.06em] text-emerald-200">{post.score}</p>
                        <p className="mt-1 text-sm text-club-text-soft">
                          {t("activityFeed.official.mvp", { name: post.mvpPlayer ?? "" })}
                        </p>
                        <p className="mt-2 text-sm text-club-muted">{post.description}</p>
                        <p className="mt-1 text-xs text-club-muted">{formatRelativeTime(post.createdAt, locale)}</p>

                        <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                        <CommentsPanel
                          post={post}
                          draft={commentDrafts[post.id] ?? ""}
                          onDraft={(value) => setDraft(post.id, value)}
                          onSubmit={() => submitComment(post)}
                          locale={locale}
                          t={t}
                        />
                      </Card>
                    );
                  }

                  if (post.kind === "ANNOUNCEMENT") {
                    return (
                      <Card
                        key={post.id}
                        className="cn-feed-stagger border-emerald-300/40 bg-[linear-gradient(145deg,rgba(34,229,132,0.15),rgba(10,16,26,0.92)_40%,rgba(0,0,0,0.88))] hover:-translate-y-1"
                        style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/45 bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                            <Pin className="h-3.5 w-3.5" />
                            {t("activityFeed.official.labels.pinned")}
                          </div>
                          <p className="text-xs text-club-muted">{formatRelativeTime(post.createdAt, locale)}</p>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <Avatar name={post.actorName ?? t("roles.coach")} avatarUrl={post.actorAvatar} size="md" />
                          <div>
                            <p className="text-sm font-semibold text-white">{post.actorName}</p>
                            <p className="text-xs text-club-muted">{t("activityFeed.official.labels.coachPost")}</p>
                          </div>
                        </div>

                        <h3 className="mt-4 text-xl font-semibold text-white">{post.title}</h3>
                        <p className="mt-2 text-sm text-club-text-soft">{post.description}</p>

                        <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                        <CommentsPanel
                          post={post}
                          draft={commentDrafts[post.id] ?? ""}
                          onDraft={(value) => setDraft(post.id, value)}
                          onSubmit={() => submitComment(post)}
                          locale={locale}
                          t={t}
                        />
                      </Card>
                    );
                  }

                  if (post.kind === "MOTIVATION") {
                    return (
                      <Card
                        key={post.id}
                        className="cn-feed-stagger border-emerald-300/30 bg-[radial-gradient(circle_at_top,rgba(34,229,132,0.2),rgba(8,13,20,0.95)_50%)] text-center hover:-translate-y-1"
                        style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                      >
                        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-500/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
                          <Megaphone className="h-3.5 w-3.5" />
                          {t("activityFeed.official.labels.coachMessage")}
                        </div>

                        <div className="relative mx-auto mt-4 max-w-xl">
                          <Quote className="absolute -left-1 -top-3 h-6 w-6 text-emerald-300/60" />
                          <p className="font-heading text-3xl uppercase tracking-[0.06em] text-white">{post.quote}</p>
                        </div>

                        <p className="mt-3 text-sm text-club-text-soft">{post.description}</p>
                        <p className="mt-2 text-xs text-club-muted">{formatRelativeTime(post.createdAt, locale)}</p>

                        <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                        <CommentsPanel
                          post={post}
                          draft={commentDrafts[post.id] ?? ""}
                          onDraft={(value) => setDraft(post.id, value)}
                          onSubmit={() => submitComment(post)}
                          locale={locale}
                          t={t}
                        />
                      </Card>
                    );
                  }

                  if (post.kind === "EVENT") {
                    return (
                      <Card
                        key={post.id}
                        className="cn-feed-stagger border-emerald-300/30 bg-[linear-gradient(145deg,rgba(34,229,132,0.12),rgba(8,13,20,0.95)_55%,rgba(245,200,101,0.14))] hover:-translate-y-1"
                        style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">{post.title}</h3>
                            <p className="mt-1 text-sm text-club-text-soft">{post.description}</p>
                          </div>
                          <span className="rounded-full border border-amber-300/35 bg-amber-500/12 px-2.5 py-1 text-xs font-bold text-amber-100">
                            {post.countdown}
                          </span>
                        </div>

                        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-club-text-soft">
                          <CalendarClock className="h-4 w-4 text-emerald-200" />
                          {post.eventDate}
                        </div>

                        <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                        <CommentsPanel
                          post={post}
                          draft={commentDrafts[post.id] ?? ""}
                          onDraft={(value) => setDraft(post.id, value)}
                          onSubmit={() => submitComment(post)}
                          locale={locale}
                          t={t}
                        />
                      </Card>
                    );
                  }

                  return (
                    <Card
                      key={post.id}
                      className="cn-feed-stagger border-emerald-300/25 bg-white/[0.04] hover:-translate-y-1"
                      style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">{post.title}</h3>
                          <p className="mt-2 text-sm text-club-text-soft">{post.description}</p>
                        </div>
                        <Tag label={t("activityFeed.official.labels.weekly")} tone="cyan" />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">{t("activityFeed.official.labels.sessions")}</p>
                          <p className="mt-1 text-2xl font-black text-white">{post.sessionsCompleted}</p>
                          <p className="text-xs text-club-muted">{t("activityFeed.official.labels.completedThisWeek")}</p>
                        </div>
                        <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">{t("activityFeed.official.labels.pointsEarned")}</p>
                          <p className="mt-1 text-2xl font-black text-white">+{post.pointsEarned}</p>
                          <p className="text-xs text-club-muted">{t("activityFeed.official.labels.performanceGain")}</p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-club-muted">{formatRelativeTime(post.createdAt, locale)}</p>

                      <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                      <CommentsPanel
                        post={post}
                        draft={commentDrafts[post.id] ?? ""}
                        onDraft={(value) => setDraft(post.id, value)}
                        onSubmit={() => submitComment(post)}
                        locale={locale}
                        t={t}
                      />
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">
                {t("activityFeed.community.title")}
              </h3>
              <Tag label={t("activityFeed.community.tag")} tone="green" />
            </div>

            {feedError ? (
              <Card className="border-rose-300/35 bg-rose-500/10 p-4">
                <p className="text-sm text-rose-100">{feedError}</p>
              </Card>
            ) : null}

            <Card className="sticky top-20 z-20 border-emerald-300/30 bg-[linear-gradient(145deg,rgba(34,229,132,0.12),rgba(10,16,26,0.9)_45%,rgba(0,0,0,0.85))] md:static">
              <div className="flex items-start gap-3">
                <Avatar name={resolvedUserName} avatarUrl={userAvatar} size="md" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{t("activityFeed.community.createTitle")}</p>
                    <p className="text-xs text-club-muted">{t("activityFeed.community.createSubtitle")}</p>
                  </div>

                  <textarea
                    value={composerText}
                    onChange={(event) => setComposerText(event.target.value)}
                    rows={3}
                    disabled={!canCreateCommunityPost}
                    className="cn-input min-h-[86px] disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder={
                      canCreateCommunityPost
                        ? t("activityFeed.community.createSubtitle")
                        : t("activityFeed.community.onlyMembers")
                    }
                  />

                  {composerImageUrl ? (
                    <div className="group relative h-44 overflow-hidden rounded-xl border border-emerald-300/35 bg-black/20">
                      <Image
                        src={composerImageUrl}
                        alt="Post preview"
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : null}

                  {postError ? <p className="text-xs text-rose-300">{postError}</p> : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!canCreateCommunityPost}
                      onClick={() => setComposerType("PHOTO")}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-55",
                        composerType === "PHOTO"
                          ? "border-emerald-300/50 bg-emerald-500/20 text-emerald-100"
                          : "border-white/15 bg-white/5 text-club-muted hover:border-emerald-300/35 hover:text-emerald-100",
                      )}
                    >
                      <Camera className="mr-1 inline-flex h-3.5 w-3.5" />
                      {t("activityFeed.community.actions.photo")}
                    </button>
                    <button
                      type="button"
                      disabled={!canCreateCommunityPost}
                      onClick={() => setComposerType("ACHIEVEMENT")}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-55",
                        composerType === "ACHIEVEMENT"
                          ? "border-amber-300/50 bg-amber-500/18 text-amber-100"
                          : "border-white/15 bg-white/5 text-club-muted hover:border-amber-300/35 hover:text-amber-100",
                      )}
                    >
                      <Trophy className="mr-1 inline-flex h-3.5 w-3.5" />
                      {t("activityFeed.community.actions.achievement")}
                    </button>
                    <button
                      type="button"
                      disabled={!canCreateCommunityPost}
                      onClick={() => setComposerType("TEXT")}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-55",
                        composerType === "TEXT"
                          ? "border-cyan-300/50 bg-cyan-500/18 text-cyan-100"
                          : "border-white/15 bg-white/5 text-club-muted hover:border-cyan-300/35 hover:text-cyan-100",
                      )}
                    >
                      <Sparkles className="me-1 inline-flex h-3.5 w-3.5" />
                      {t("activityFeed.community.actions.text")}
                    </button>

                    {composerType === "PHOTO" ? (
                      <label className="ms-auto cursor-pointer rounded-full border border-emerald-300/35 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20">
                        {t("activityFeed.community.actions.addImage")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleComposerImage}
                          disabled={!canCreateCommunityPost}
                        />
                      </label>
                    ) : null}
                  </div>

                  {composerType === "TEXT" ? (
                    <label className="inline-flex items-center gap-2 text-xs text-club-text-soft">
                      <input
                        type="checkbox"
                        checked={supportMode}
                        onChange={(event) => setSupportMode(event.target.checked)}
                        disabled={!canCreateCommunityPost}
                        className="h-3.5 w-3.5 rounded border-white/20 bg-white/10"
                      />
                      {t("activityFeed.community.actions.support")}
                    </label>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isPosting || !canCreateCommunityPost}
                      onClick={createCommunityPost}
                      className="cn-btn cn-btn-primary !px-4 !py-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {isPosting
                        ? t("activityFeed.community.actions.posting")
                        : t("activityFeed.community.actions.post")}
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {visibleCommunityPosts.length === 0 ? (
              <Card className="border-dashed border-white/15 bg-black/20 py-10 text-center">
                <p className="text-sm text-club-muted">{t("activityFeed.empty")}</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {visibleCommunityPosts.map((post, index) => {
                  const postMeta = communityTypeMeta(post.postType, t);
                  const isModeratingPost = moderationAction?.postId === post.id;

                  return (
                    <Card
                      key={post.id}
                      className="cn-feed-stagger group border-emerald-300/25 bg-white/[0.04] hover:-translate-y-1 hover:border-emerald-300/35"
                      style={{ ["--cn-stagger-delay" as string]: `${index * 80}ms` }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={post.authorName} avatarUrl={post.authorAvatar} size="md" />
                          <div>
                            <p className="text-sm font-semibold text-white">{post.authorName}</p>
                            <p className="text-xs text-club-muted">{formatRelativeTime(post.createdAt, locale)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Tag label={postMeta.label} tone={postMeta.tone} />
                          {post.pinnedByCoach ? <Tag label="Pinned by Coach" tone="gold" /> : null}
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-club-text-soft">{post.caption}</p>

                      {post.imageUrl ? (
                        <div className="group/image relative mt-3 h-64 overflow-hidden rounded-xl border border-emerald-300/25 bg-black/25">
                          <Image
                            src={post.imageUrl}
                            alt={`${post.authorName} community post`}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 720px"
                            className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                          />
                        </div>
                      ) : null}

                      <ReactionBar post={post} pulseKey={pulseKey} onToggleReaction={handleToggleReaction} onShare={handleShare} t={t} />
                      <CommentsPanel
                        post={post}
                        draft={commentDrafts[post.id] ?? ""}
                        onDraft={(value) => setDraft(post.id, value)}
                        onSubmit={() => submitComment(post)}
                        locale={locale}
                        t={t}
                      />

                      {canModerate ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                          <button
                            type="button"
                            disabled={isModeratingPost}
                            onClick={() => {
                              void applyModerationAction(post, "HIDE");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-500/12 px-2.5 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Hide
                          </button>

                          <button
                            type="button"
                            disabled={isModeratingPost}
                            onClick={() => {
                              void applyModerationAction(post, "DELETE");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/35 bg-rose-500/12 px-2.5 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>

                          {post.postType === "ACHIEVEMENT" ? (
                            <button
                              type="button"
                              disabled={isModeratingPost}
                              onClick={() => {
                                void applyModerationAction(
                                  post,
                                  post.pinnedByCoach ? "UNPIN" : "PIN",
                                );
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                            >
                              {post.pinnedByCoach ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                              {post.pinnedByCoach ? "Unpin" : "Pin Achievement"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
