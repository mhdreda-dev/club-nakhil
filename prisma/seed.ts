import {
  AccountStatus,
  CommunityPostCategory,
  CommunityPostStatus,
  CommunityPostType,
  CommunityReactionType,
  Gender,
  MembershipType,
  PrismaClient,
  Role,
  TrainingLevel,
  TrainingType,
} from "@prisma/client";
import { addDays, subDays, subHours } from "date-fns";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const ATTENDANCE_POINTS = 2;

async function main() {
  await prisma.communityReaction.deleteMany();
  await prisma.communityComment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.memberBadge.deleteMany();
  await prisma.pointsLog.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.progressNote.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.trainingSession.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin Nakhil",
      fullName: "Admin Nakhil",
      email: "admin@clubnakhil.ma",
      passwordHash: hashSync("Admin123!", 10),
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  const coach = await prisma.user.create({
    data: {
      name: "Coach Yassine",
      fullName: "Coach Yassine",
      email: "coach@clubnakhil.ma",
      passwordHash: hashSync("Coach123!", 10),
      role: Role.COACH,
      status: AccountStatus.ACTIVE,
    },
  });

  const members = await Promise.all([
    prisma.user.create({
      data: {
        name: "Ayoub El Idrissi",
        fullName: "Ayoub El Idrissi",
        email: "ayoub@clubnakhil.ma",
        passwordHash: hashSync("Member123!", 10),
        role: Role.MEMBER,
        status: AccountStatus.ACTIVE,
        sportLevel: TrainingLevel.INTERMEDIATE,
        membershipType: MembershipType.MONTHLY,
      },
    }),
    prisma.user.create({
      data: {
        name: "Salma Naji",
        fullName: "Salma Naji",
        email: "salma@clubnakhil.ma",
        passwordHash: hashSync("Member123!", 10),
        role: Role.MEMBER,
        status: AccountStatus.ACTIVE,
        sportLevel: TrainingLevel.BEGINNER,
        membershipType: MembershipType.QUARTERLY,
      },
    }),
    prisma.user.create({
      data: {
        name: "Hamza Moutaouakil",
        fullName: "Hamza Moutaouakil",
        email: "hamza@clubnakhil.ma",
        passwordHash: hashSync("Member123!", 10),
        role: Role.MEMBER,
        status: AccountStatus.ACTIVE,
        sportLevel: TrainingLevel.INTERMEDIATE,
        membershipType: MembershipType.ANNUAL,
      },
    }),
    prisma.user.create({
      data: {
        name: "Nour Benkiran",
        fullName: "Nour Benkiran",
        email: "nour@clubnakhil.ma",
        passwordHash: hashSync("Member123!", 10),
        role: Role.MEMBER,
        status: AccountStatus.ACTIVE,
        sportLevel: TrainingLevel.BEGINNER,
        membershipType: MembershipType.MONTHLY,
      },
    }),
  ]);

  await prisma.userProfile.create({
    data: {
      userId: admin.id,
      fullName: admin.name,
      displayName: "Club Admin",
      phone: "+212655000111",
      city: "Casablanca",
      address: "Club Nakhil HQ, Casablanca",
      bio: "Platform administrator responsible for member approvals and operations.",
      emergencyContact: "Club Office +212522000111",
      joinedAt: admin.createdAt,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: coach.id,
      fullName: coach.name,
      displayName: "Coach Yassine",
      phone: "+212612345678",
      dateOfBirth: new Date("1988-05-14T00:00:00.000Z"),
      gender: Gender.MALE,
      city: "Casablanca",
      address: "Maarif District, Casablanca",
      bio: "Head kickboxing coach focused on discipline, technique, and growth mindset.",
      emergencyContact: "Club Office +212522000111",
      avatarUrl: "https://images.unsplash.com/photo-1541534401786-2077eed87a72?w=300&q=80",
      avatarPath: "/seed/avatars/coach-yassine.jpg",
      joinedAt: coach.createdAt,
      coachProfile: {
        create: {
          specialization: "Kickboxing Technique & Competitive Sparring",
          yearsOfExperience: 12,
          certifications: [
            "National Kickboxing Federation License",
            "Strength & Conditioning Certificate",
          ],
          coachingStyle:
            "Structured fundamentals with high-energy rounds and tactical feedback.",
          achievements:
            "Former national finalist and coach of multiple amateur tournament medalists.",
        },
      },
    },
  });

  await Promise.all([
    prisma.userProfile.create({
      data: {
        userId: members[0].id,
        fullName: members[0].name,
        displayName: "Ayoub",
        phone: "+212600111222",
        dateOfBirth: new Date("2000-02-02T00:00:00.000Z"),
        gender: Gender.MALE,
        city: "Casablanca",
        address: "Ain Sebaa, Casablanca",
        bio: "Focused on consistency and ring movement.",
        emergencyContact: "Parent +212611111111",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
        avatarPath: "/seed/avatars/ayoub.jpg",
        joinedAt: members[0].createdAt,
        memberProfile: {
          create: {
            trainingLevel: TrainingLevel.INTERMEDIATE,
            preferredTrainingType: TrainingType.TECHNIQUE,
          },
        },
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: members[1].id,
        fullName: members[1].name,
        displayName: "Salma",
        phone: "+212600333444",
        dateOfBirth: new Date("2001-08-10T00:00:00.000Z"),
        gender: Gender.FEMALE,
        city: "Rabat",
        address: "Agdal, Rabat",
        bio: "Improving cardio conditioning and defensive timing.",
        emergencyContact: "Sibling +212622222222",
        avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&q=80",
        avatarPath: "/seed/avatars/salma.jpg",
        joinedAt: members[1].createdAt,
        memberProfile: {
          create: {
            trainingLevel: TrainingLevel.BEGINNER,
            preferredTrainingType: TrainingType.CARDIO,
          },
        },
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: members[2].id,
        fullName: members[2].name,
        displayName: "Hamza",
        phone: "+212600555666",
        dateOfBirth: new Date("1999-11-21T00:00:00.000Z"),
        gender: Gender.MALE,
        city: "Marrakech",
        address: "Guéliz, Marrakech",
        bio: "Works on balance and recovery mechanics after kicks.",
        emergencyContact: "Parent +212633333333",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
        avatarPath: "/seed/avatars/hamza.jpg",
        joinedAt: members[2].createdAt,
        memberProfile: {
          create: {
            trainingLevel: TrainingLevel.INTERMEDIATE,
            preferredTrainingType: TrainingType.CONDITIONING,
          },
        },
      },
    }),
    prisma.userProfile.create({
      data: {
        userId: members[3].id,
        fullName: members[3].name,
        displayName: "Nour",
        phone: "+212600777888",
        dateOfBirth: new Date("2002-04-18T00:00:00.000Z"),
        gender: Gender.FEMALE,
        city: "Tangier",
        address: "Iberia, Tangier",
        bio: "Building confidence in sparring and combo transitions.",
        emergencyContact: "Parent +212644444444",
        avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80",
        avatarPath: "/seed/avatars/nour.jpg",
        joinedAt: members[3].createdAt,
        memberProfile: {
          create: {
            trainingLevel: TrainingLevel.BEGINNER,
            preferredTrainingType: TrainingType.SPARRING,
          },
        },
      },
    }),
  ]);

  const [firstSessionBadge, fiveSessionsBadge, tenSessionsBadge, perfectWeekBadge] = await Promise.all([
    prisma.badge.create({
      data: {
        key: "FIRST_SESSION",
        name: "First Session",
        description: "Completed your first Club Nakhil training session.",
      },
    }),
    prisma.badge.create({
      data: {
        key: "FIVE_SESSIONS",
        name: "5 Sessions Completed",
        description: "Reached 5 total attended sessions.",
      },
    }),
    prisma.badge.create({
      data: {
        key: "TEN_SESSIONS",
        name: "10 Sessions Completed",
        description: "Reached 10 total attended sessions.",
      },
    }),
    prisma.badge.create({
      data: {
        key: "PERFECT_WEEK",
        name: "Perfect Attendance Week",
        description: "Attended every scheduled session this week.",
      },
    }),
  ]);

  const today = new Date();

  const sessions = await Promise.all([
    prisma.trainingSession.create({
      data: {
        title: "Explosive Footwork & Cardio",
        sessionDate: subDays(today, 3),
        startTime: "19:00",
        endTime: "20:15",
        trainingType: TrainingType.CARDIO,
        level: TrainingLevel.INTERMEDIATE,
        notes: "Focus on ring movement and stamina rounds.",
        coachId: coach.id,
        qrToken: "nakhil-session-001",
      },
    }),
    prisma.trainingSession.create({
      data: {
        title: "Precision Technique Drills",
        sessionDate: subDays(today, 1),
        startTime: "19:30",
        endTime: "20:45",
        trainingType: TrainingType.TECHNIQUE,
        level: TrainingLevel.BEGINNER,
        notes: "Punch combinations and defensive transitions.",
        coachId: coach.id,
        qrToken: "nakhil-session-002",
      },
    }),
    prisma.trainingSession.create({
      data: {
        title: "Controlled Sparring Night",
        sessionDate: addDays(today, 1),
        startTime: "20:00",
        endTime: "21:30",
        trainingType: TrainingType.SPARRING,
        level: TrainingLevel.ADVANCED,
        notes: "Protective gear mandatory.",
        coachId: coach.id,
        qrToken: "nakhil-session-003",
      },
    }),
    prisma.trainingSession.create({
      data: {
        title: "Conditioning Circuit & Core",
        sessionDate: addDays(today, 3),
        startTime: "18:30",
        endTime: "19:45",
        trainingType: TrainingType.CONDITIONING,
        level: TrainingLevel.INTERMEDIATE,
        notes: "High-intensity interval blocks.",
        coachId: coach.id,
        qrToken: "nakhil-session-004",
      },
    }),
  ]);

  await Promise.all([
    prisma.attendance.create({
      data: {
        sessionId: sessions[0].id,
        memberId: members[0].id,
      },
    }),
    prisma.attendance.create({
      data: {
        sessionId: sessions[0].id,
        memberId: members[1].id,
      },
    }),
    prisma.attendance.create({
      data: {
        sessionId: sessions[1].id,
        memberId: members[0].id,
      },
    }),
    prisma.attendance.create({
      data: {
        sessionId: sessions[1].id,
        memberId: members[2].id,
      },
    }),
  ]);

  await Promise.all([
    prisma.pointsLog.createMany({
      data: [
        {
          memberId: members[0].id,
          sessionId: sessions[0].id,
          points: ATTENDANCE_POINTS,
          reason: "Attendance: Explosive Footwork & Cardio",
        },
        {
          memberId: members[1].id,
          sessionId: sessions[0].id,
          points: ATTENDANCE_POINTS,
          reason: "Attendance: Explosive Footwork & Cardio",
        },
        {
          memberId: members[0].id,
          sessionId: sessions[1].id,
          points: ATTENDANCE_POINTS,
          reason: "Attendance: Precision Technique Drills",
        },
        {
          memberId: members[2].id,
          sessionId: sessions[1].id,
          points: ATTENDANCE_POINTS,
          reason: "Attendance: Precision Technique Drills",
        },
      ],
    }),
    prisma.memberBadge.createMany({
      data: [
        {
          memberId: members[0].id,
          badgeId: firstSessionBadge.id,
        },
        {
          memberId: members[1].id,
          badgeId: firstSessionBadge.id,
        },
        {
          memberId: members[2].id,
          badgeId: firstSessionBadge.id,
        },
        {
          memberId: members[0].id,
          badgeId: fiveSessionsBadge.id,
        },
        {
          memberId: members[0].id,
          badgeId: perfectWeekBadge.id,
        },
      ],
    }),
  ]);

  await Promise.all([
    prisma.rating.create({
      data: {
        sessionId: sessions[0].id,
        memberId: members[0].id,
        coachId: coach.id,
        score: 5,
        comment: "Excellent pacing and clear technique corrections.",
      },
    }),
    prisma.rating.create({
      data: {
        sessionId: sessions[1].id,
        memberId: members[2].id,
        coachId: coach.id,
        score: 4,
        comment: "Great intensity, would love more sparring examples.",
      },
    }),
  ]);

  await prisma.progressNote.createMany({
    data: [
      {
        memberId: members[0].id,
        coachId: coach.id,
        note: "Power output improved significantly. Keep guarding after combinations.",
      },
      {
        memberId: members[1].id,
        coachId: coach.id,
        note: "Great attendance consistency. Focus next on lateral movement.",
      },
      {
        memberId: members[2].id,
        coachId: coach.id,
        note: "Strong conditioning effort. Work on balance recovery after kicks.",
      },
    ],
  });

  await prisma.announcement.createMany({
    data: [
      {
        coachId: coach.id,
        title: "Gloves & Shin Guards Reminder",
        content: "Bring your full protective gear for tomorrow's controlled sparring night.",
      },
      {
        coachId: coach.id,
        title: "Monday Session Time Update",
        content: "Conditioning starts at 18:30 sharp. Please arrive 10 minutes early for warm-up.",
      },
    ],
  });

  const communityPosts = await Promise.all([
    prisma.communityPost.create({
      data: {
        authorId: members[3].id,
        postType: CommunityPostType.PHOTO,
        category: CommunityPostCategory.TRAINING,
        caption: "Heavy bag rounds complete. Focused on speed and clean exits.",
        imageUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80",
        imagePath: "/seed/community/community-photo-1.jpg",
        status: CommunityPostStatus.VISIBLE,
        shareCount: 2,
        createdAt: subHours(today, 2),
      },
    }),
    prisma.communityPost.create({
      data: {
        authorId: members[1].id,
        postType: CommunityPostType.ACHIEVEMENT,
        category: CommunityPostCategory.ACHIEVEMENTS,
        caption: "Reached Top 5 leaderboard this week. Next target: Top 3.",
        status: CommunityPostStatus.VISIBLE,
        pinnedByCoach: true,
        moderatedById: coach.id,
        moderatedAt: subHours(today, 5),
        shareCount: 4,
        createdAt: subHours(today, 6),
      },
    }),
    prisma.communityPost.create({
      data: {
        authorId: members[2].id,
        postType: CommunityPostType.TEXT,
        category: CommunityPostCategory.TRAINING,
        caption: "Ready for tonight training. Never skip discipline.",
        status: CommunityPostStatus.VISIBLE,
        shareCount: 1,
        createdAt: subHours(today, 10),
      },
    }),
    prisma.communityPost.create({
      data: {
        authorId: members[0].id,
        postType: CommunityPostType.SUPPORT,
        category: CommunityPostCategory.EVENTS,
        caption: "Good luck team for tomorrow. Proud of everyone today.",
        status: CommunityPostStatus.VISIBLE,
        shareCount: 3,
        createdAt: subDays(today, 1),
      },
    }),
  ]);

  await prisma.communityComment.createMany({
    data: [
      {
        postId: communityPosts[0].id,
        authorId: members[2].id,
        content: "Sharp form!",
        createdAt: subHours(today, 1),
      },
      {
        postId: communityPosts[1].id,
        authorId: coach.id,
        content: "Excellent progress.",
        createdAt: subHours(today, 5),
      },
      {
        postId: communityPosts[3].id,
        authorId: members[3].id,
        content: "Let's go team.",
        createdAt: subHours(today, 21),
      },
    ],
  });

  await prisma.communityReaction.createMany({
    data: [
      {
        postId: communityPosts[0].id,
        userId: members[0].id,
        reactionType: CommunityReactionType.LIKE,
      },
      {
        postId: communityPosts[0].id,
        userId: members[1].id,
        reactionType: CommunityReactionType.FIRE,
      },
      {
        postId: communityPosts[0].id,
        userId: members[2].id,
        reactionType: CommunityReactionType.CLAP,
      },
      {
        postId: communityPosts[1].id,
        userId: members[0].id,
        reactionType: CommunityReactionType.LIKE,
      },
      {
        postId: communityPosts[1].id,
        userId: members[2].id,
        reactionType: CommunityReactionType.FIRE,
      },
      {
        postId: communityPosts[1].id,
        userId: members[3].id,
        reactionType: CommunityReactionType.CLAP,
      },
      {
        postId: communityPosts[2].id,
        userId: members[0].id,
        reactionType: CommunityReactionType.LIKE,
      },
      {
        postId: communityPosts[3].id,
        userId: members[1].id,
        reactionType: CommunityReactionType.CLAP,
      },
      {
        postId: communityPosts[3].id,
        userId: members[2].id,
        reactionType: CommunityReactionType.LIKE,
      },
    ],
  });

  // Included for future milestone assignment in demos.
  await prisma.memberBadge.create({
    data: {
      memberId: members[0].id,
      badgeId: tenSessionsBadge.id,
    },
  });

  await Promise.all(
    members.map(async (member) => {
      const [attendanceCount, pointsAggregate, ratingAggregate] = await Promise.all([
        prisma.attendance.count({
          where: {
            memberId: member.id,
          },
        }),
        prisma.pointsLog.aggregate({
          where: {
            memberId: member.id,
          },
          _sum: {
            points: true,
          },
        }),
        prisma.rating.aggregate({
          where: {
            memberId: member.id,
          },
          _avg: {
            score: true,
          },
        }),
      ]);

      await prisma.memberProfile.update({
        where: {
          userId: member.id,
        },
        data: {
          attendanceCount,
          totalPoints: pointsAggregate._sum.points ?? 0,
          overallRating: ratingAggregate._avg.score ?? 0,
        },
      });
    }),
  );

  console.log("Seed completed for Club Nakhil MVP.");
  console.log("Coach login: coach@clubnakhil.ma / Coach123!");
  console.log("Member login: ayoub@clubnakhil.ma / Member123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
