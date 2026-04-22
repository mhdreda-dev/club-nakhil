import { Gender, TrainingLevel, TrainingType } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  displayName: z.string().min(2).max(80).optional(),
  phone: z.string().max(40).optional(),
  dateOfBirth: z.union([z.string().date(), z.literal("")]).optional(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  city: z.string().max(120).optional(),
  address: z.string().max(240).optional(),
  bio: z.string().max(1200).optional(),
  emergencyContact: z.string().max(240).optional(),
  avatarUrl: z.union([z.string().url().max(1200), z.literal("")]).optional(),
  avatarPath: z.string().max(1200).optional(),
  coachProfile: z
    .object({
      specialization: z.string().max(160).optional(),
      yearsOfExperience: z.number().int().min(0).max(70).optional().nullable(),
      certifications: z.array(z.string().max(160)).optional(),
      coachingStyle: z.string().max(1000).optional(),
      achievements: z.string().max(1000).optional(),
    })
    .optional(),
  memberProfile: z
    .object({
      trainingLevel: z.nativeEnum(TrainingLevel).optional(),
      preferredTrainingType: z.nativeEnum(TrainingType).optional().nullable(),
    })
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export type NormalizedProfileUpdate = {
  fullName?: string;
  displayName?: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  city?: string | null;
  address?: string | null;
  bio?: string | null;
  emergencyContact?: string | null;
  avatarUrl?: string | null;
  avatarPath?: string | null;
  coachProfile?: {
    specialization?: string | null;
    yearsOfExperience?: number | null;
    certifications?: string[];
    coachingStyle?: string | null;
    achievements?: string | null;
  };
  memberProfile?: {
    trainingLevel?: TrainingLevel;
    preferredTrainingType?: TrainingType | null;
  };
};

export function normalizeProfileUpdate(input: ProfileUpdateInput): NormalizedProfileUpdate {
  return {
    fullName: input.fullName ? input.fullName.trim() : undefined,
    displayName: input.displayName ? input.displayName.trim() : undefined,
    phone: input.phone !== undefined ? emptyToUndefined(input.phone) ?? null : undefined,
    dateOfBirth:
      input.dateOfBirth !== undefined
        ? input.dateOfBirth
          ? new Date(`${input.dateOfBirth}T00:00:00.000Z`)
          : null
        : undefined,
    gender: input.gender ?? undefined,
    city: input.city !== undefined ? emptyToUndefined(input.city) ?? null : undefined,
    address: input.address !== undefined ? emptyToUndefined(input.address) ?? null : undefined,
    bio: input.bio !== undefined ? emptyToUndefined(input.bio) ?? null : undefined,
    emergencyContact:
      input.emergencyContact !== undefined
        ? emptyToUndefined(input.emergencyContact) ?? null
        : undefined,
    avatarUrl: input.avatarUrl !== undefined ? emptyToUndefined(input.avatarUrl) ?? null : undefined,
    avatarPath: input.avatarPath !== undefined ? emptyToUndefined(input.avatarPath) ?? null : undefined,
    coachProfile: input.coachProfile
      ? {
          specialization:
            input.coachProfile.specialization !== undefined
              ? emptyToUndefined(input.coachProfile.specialization) ?? null
              : undefined,
          yearsOfExperience:
            input.coachProfile.yearsOfExperience !== undefined
              ? input.coachProfile.yearsOfExperience
              : undefined,
          certifications:
            input.coachProfile.certifications !== undefined
              ? input.coachProfile.certifications
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
              : undefined,
          coachingStyle:
            input.coachProfile.coachingStyle !== undefined
              ? emptyToUndefined(input.coachProfile.coachingStyle) ?? null
              : undefined,
          achievements:
            input.coachProfile.achievements !== undefined
              ? emptyToUndefined(input.coachProfile.achievements) ?? null
              : undefined,
        }
      : undefined,
    memberProfile: input.memberProfile
      ? {
          trainingLevel: input.memberProfile.trainingLevel,
          preferredTrainingType: input.memberProfile.preferredTrainingType,
        }
      : undefined,
  };
}
