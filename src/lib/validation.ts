import {
  AccountStatus,
  Gender,
  MembershipType,
  TrainingLevel,
  TrainingType,
} from "@prisma/client";
import { z } from "zod";

export const sessionFormSchema = z.object({
  title: z.string().min(3).max(120),
  sessionDate: z.string().date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  trainingType: z.nativeEnum(TrainingType),
  level: z.nativeEnum(TrainingLevel),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const ratingSchema = z.object({
  sessionId: z.string().cuid(),
  score: z.number().min(1).max(5),
  comment: z.string().max(500).optional().or(z.literal("")),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(5).max(1000),
});

export const progressNoteSchema = z.object({
  memberId: z.string().cuid(),
  note: z.string().min(5).max(1000),
});

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Phone number is required.")
  .max(40, "Phone number is too long.")
  .regex(/^[0-9+()\-\s]+$/, "Phone number contains invalid characters.");

const memberRegistrationBaseSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().email("A valid email is required.").trim().toLowerCase(),
  phone: phoneSchema,
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  dateOfBirth: z.string().date("Date of birth is required."),
  gender: z.nativeEnum(Gender),
  address: z.string().trim().min(5, "Address is required.").max(240),
  emergencyContact: z.string().trim().min(3, "Emergency contact is required.").max(240),
  sportLevel: z.nativeEnum(TrainingLevel),
  membershipType: z.nativeEnum(MembershipType),
});

export const memberRegistrationSchema = memberRegistrationBaseSchema
  .extend({
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const manualMemberCreateSchema = memberRegistrationBaseSchema
  .extend({
    status: z.nativeEnum(AccountStatus).default(AccountStatus.ACTIVE),
    profileImage: z.union([z.string().url().max(1200), z.literal("")]).optional(),
  });

export const memberStatusFilterSchema = z.nativeEnum(AccountStatus).optional();
