import { TrainingLevel, TrainingType } from "@prisma/client";

export const ATTENDANCE_POINTS = 2;

export const trainingTypeOptions: { value: TrainingType; label: string }[] = [
  { value: "CARDIO", label: "Cardio" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "SPARRING", label: "Sparring" },
  { value: "CONDITIONING", label: "Conditioning" },
];

export const trainingLevelOptions: { value: TrainingLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const badgeMilestones = [
  {
    key: "FIRST_SESSION",
    minSessions: 1,
  },
  {
    key: "FIVE_SESSIONS",
    minSessions: 5,
  },
  {
    key: "TEN_SESSIONS",
    minSessions: 10,
  },
] as const;
