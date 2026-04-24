"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ClubLogo } from "@/components/club-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/components/providers/translations-provider";
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_FILE_INPUT_ACCEPT,
  AVATAR_MAX_FILE_SIZE_BYTES,
} from "@/features/profiles/avatar.constants";
import type { Locale, Translate } from "@/lib/i18n";
import {
  translateGender,
  translateMembershipType,
  translateTrainingLevel,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string>;

type RegistrationFormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  gender: string;
  emergencyContact: string;
  sportLevel: string;
  membershipType: string;
};

type RegisterResponse = {
  ok?: boolean;
  message?: string;
  email?: string;
  warning?: string | null;
  warningCode?: "avatar-upload-failed" | null;
  fieldErrors?: FieldErrors;
};

const genderOptions = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;
const sportLevelOptions = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const membershipTypeOptions = ["MONTHLY", "QUARTERLY", "ANNUAL"] as const;

const initialState: RegistrationFormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  gender: "MALE",
  emergencyContact: "",
  sportLevel: "BEGINNER",
  membershipType: "MONTHLY",
};

function inputClass(error?: string) {
  return cn("cn-input", error ? "!border-rose-400/55" : "");
}

function normalizeFieldErrors(fieldErrors: unknown) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fieldErrors as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function translateRegisterMessage(message: string | null | undefined, t: Translate) {
  if (!message) {
    return null;
  }

  if (message === "Please review the required fields.") {
    return t("auth.signupPage.errors.review");
  }

  if (message === "Some information is missing or invalid.") {
    return t("auth.signupPage.errors.invalid");
  }

  if (message === "Passwords do not match.") {
    return t("auth.signupPage.errors.passwordMismatch");
  }

  if (message === "Please upload a valid image under 3 MB.") {
    return t("auth.signupPage.errors.image");
  }

  if (message === "This email is already registered.") {
    return t("auth.signupPage.errors.emailExists");
  }

  if (message === "Unable to complete sign up right now.") {
    return t("auth.signupPage.errors.unavailable");
  }

  if (message === "Your account was created, but the profile image could not be uploaded.") {
    return t("auth.signupPage.warnings.avatarUpload");
  }

  return message;
}

function translateFieldError(
  key: string,
  message: string,
  t: Translate,
) {
  const lowerMessage = message.toLowerCase();

  if (key === "email" && lowerMessage.includes("already exists")) {
    return t("auth.signupPage.errors.emailExistsField");
  }

  if (key === "profileImage" && lowerMessage.includes("unsupported image format")) {
    return t("auth.signupPage.errors.imageFormat");
  }

  if (key === "profileImage" && lowerMessage.includes("too large")) {
    return t("auth.signupPage.errors.image");
  }

  return translateRegisterMessage(message, t) ?? message;
}

function getValidationSummary(
  fieldErrors: FieldErrors,
  fallback: string | null | undefined,
  t: Translate,
) {
  if (fieldErrors.profileImage) {
    return t("auth.signupPage.errors.image");
  }

  if (fieldErrors.confirmPassword?.toLowerCase().includes("match")) {
    return t("auth.signupPage.errors.passwordMismatch");
  }

  if (Object.keys(fieldErrors).length > 0) {
    const hasFormatIssue = Object.values(fieldErrors).some((message) => {
      const lowerMessage = message.toLowerCase();

      return (
        lowerMessage.includes("valid") ||
        lowerMessage.includes("at least") ||
        lowerMessage.includes("already exists") ||
        lowerMessage.includes("invalid") ||
        lowerMessage.includes("under 3 mb") ||
        lowerMessage.includes("too long")
      );
    });

    return hasFormatIssue
      ? t("auth.signupPage.errors.invalid")
      : t("auth.signupPage.errors.review");
  }

  return translateRegisterMessage(fallback, t) ?? t("auth.signupPage.errors.unavailable");
}

async function parseRegisterResponse(response: Response): Promise<RegisterResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => "");

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as RegisterResponse;
  } catch {
    return {
      message: text.trim(),
    };
  }
}

function validateProfileImage(file: File, t: Translate) {
  if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number])) {
    return t("auth.signupPage.errors.imageFormat");
  }

  if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
    return t("auth.signupPage.errors.image");
  }

  return null;
}

type PremiumSignupFormProps = {
  locale: Locale;
};

export function PremiumSignupForm({ locale }: PremiumSignupFormProps) {
  const router = useRouter();
  const { dir, t } = useTranslations();
  const [form, setForm] = useState<RegistrationFormState>(initialState);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const hasImage = useMemo(() => profileImage !== null, [profileImage]);
  const inputIconClass =
    dir === "rtl" ? "right-3 left-auto" : "left-3 right-auto";
  const inputPadClass = dir === "rtl" ? "!pr-10" : "!pl-10";

  function updateField<K extends keyof RegistrationFormState>(
    key: K,
    value: RegistrationFormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function getFieldError(key: keyof RegistrationFormState | "profileImage") {
    return fieldErrors[key];
  }

  function handleProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      setProfileImage(null);
      setFieldErrors((previous) => {
        const nextErrors = { ...previous };
        delete nextErrors.profileImage;
        return nextErrors;
      });
      return;
    }

    const imageError = validateProfileImage(nextFile, t);

    if (imageError) {
      setProfileImage(null);
      setFieldErrors((previous) => ({
        ...previous,
        profileImage: imageError,
      }));
      return;
    }

    setProfileImage(nextFile);
    setFieldErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors.profileImage;
      return nextErrors;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSubmitState("loading");
    setError(null);
    setWarning(null);
    setFieldErrors({});

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), 15_000);

    try {
      const nextFieldErrors: FieldErrors = {};

      if (profileImage) {
        const imageError = validateProfileImage(profileImage, t);

        if (imageError) {
          nextFieldErrors.profileImage = imageError;
        }
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setError(getValidationSummary(nextFieldErrors, null, t));
        setSubmitState("idle");
        return;
      }

      const formData = new FormData();

      for (const [key, value] of Object.entries(form)) {
        formData.set(key, value);
      }

      if (profileImage) {
        formData.set("profileImage", profileImage);
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      const payload = await parseRegisterResponse(response);

      if (!response.ok) {
        const normalizedFieldErrors = normalizeFieldErrors(payload.fieldErrors);
        const translatedFieldErrors = Object.fromEntries(
          Object.entries(normalizedFieldErrors).map(([key, message]) => [
            key,
            translateFieldError(key, message, t),
          ]),
        );

        setFieldErrors(translatedFieldErrors);
        setError(
          getValidationSummary(
            translatedFieldErrors,
            payload.message ?? null,
            t,
          ),
        );
        setSubmitState("idle");
        return;
      }

      if (payload.warningCode === "avatar-upload-failed" || payload.warning) {
        setWarning(t("auth.signupPage.warnings.avatarUpload"));
      }

      const targetEmail =
        typeof payload.email === "string" && payload.email.length
          ? payload.email
          : form.email;

      setSubmitState("submitted");
      router.push(`/pending-approval?email=${encodeURIComponent(targetEmail)}`);
      router.refresh();
    } catch (caughtError) {
      const nextMessage =
        caughtError instanceof DOMException && caughtError.name === "AbortError"
          ? t("auth.signupPage.errors.timeout")
          : t("auth.signupPage.errors.network");

      setError(nextMessage);
      setSubmitState("idle");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_65%_55%_at_50%_-10%,rgba(220,38,38,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 cn-grid-bg opacity-35"
      />

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <BrandLogo href={`/${locale}`} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="self-start sm:self-auto">
              <LocaleSwitcher />
            </div>
            <Link
              href={`/${locale}/login`}
              className="cn-btn cn-btn-ghost justify-center"
            >
              {t("auth.signupPage.topLogin")}
            </Link>
          </div>
        </div>

        <section className="mt-8 cn-rise rounded-3xl border border-white/10 bg-club-surface/85 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-center gap-4">
            <ClubLogo size={76} glow framed />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/35 bg-red-500/12 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-red-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("auth.signupPage.badge")}
              </span>
              <h1 className="mt-3 font-heading text-3xl uppercase tracking-[0.05em] text-white">
                {t("auth.signupPage.title")}
              </h1>
              <p className="mt-1 text-sm text-club-muted">
                {t("auth.signupPage.subtitle")}
              </p>
            </div>
          </div>

          <div className="cn-hairline my-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.fullName")}
                </span>
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className={inputClass(getFieldError("fullName"))}
                  placeholder={t("auth.signupPage.placeholders.fullName")}
                />
                {getFieldError("fullName") ? (
                  <p className="text-xs text-rose-300">{getFieldError("fullName")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.email")}
                </span>
                <span className="relative block">
                  <Mail
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted",
                      inputIconClass,
                    )}
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className={cn(inputClass(getFieldError("email")), inputPadClass)}
                    placeholder={t("auth.signupPage.placeholders.email")}
                  />
                </span>
                {getFieldError("email") ? (
                  <p className="text-xs text-rose-300">{getFieldError("email")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.signupPage.fields.phone")}
                </span>
                <span className="relative block">
                  <Phone
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted",
                      inputIconClass,
                    )}
                  />
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className={cn(inputClass(getFieldError("phone")), inputPadClass)}
                    placeholder={t("auth.signupPage.placeholders.phone")}
                  />
                </span>
                {getFieldError("phone") ? (
                  <p className="text-xs text-rose-300">{getFieldError("phone")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.signupPage.fields.dateOfBirth")}
                </span>
                <span className="relative block">
                  <Calendar
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted",
                      inputIconClass,
                    )}
                  />
                  <input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => updateField("dateOfBirth", event.target.value)}
                    className={cn(inputClass(getFieldError("dateOfBirth")), inputPadClass)}
                  />
                </span>
                {getFieldError("dateOfBirth") ? (
                  <p className="text-xs text-rose-300">{getFieldError("dateOfBirth")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.signupPage.fields.gender")}
                </span>
                <select
                  value={form.gender}
                  onChange={(event) => updateField("gender", event.target.value)}
                  className={inputClass(getFieldError("gender"))}
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {translateGender(t, option)}
                    </option>
                  ))}
                </select>
                {getFieldError("gender") ? (
                  <p className="text-xs text-rose-300">{getFieldError("gender")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.signupPage.fields.skillLevel")}
                </span>
                <select
                  value={form.sportLevel}
                  onChange={(event) => updateField("sportLevel", event.target.value)}
                  className={inputClass(getFieldError("sportLevel"))}
                >
                  {sportLevelOptions.map((option) => (
                    <option key={option} value={option}>
                      {translateTrainingLevel(t, option)}
                    </option>
                  ))}
                </select>
                {getFieldError("sportLevel") ? (
                  <p className="text-xs text-rose-300">{getFieldError("sportLevel")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.signupPage.fields.membershipPlan")}
                </span>
                <select
                  value={form.membershipType}
                  onChange={(event) => updateField("membershipType", event.target.value)}
                  className={inputClass(getFieldError("membershipType"))}
                >
                  {membershipTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {translateMembershipType(t, option)}
                    </option>
                  ))}
                </select>
                {getFieldError("membershipType") ? (
                  <p className="text-xs text-rose-300">{getFieldError("membershipType")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.signupPage.fields.emergencyContact")}
                </span>
                <input
                  required
                  value={form.emergencyContact}
                  onChange={(event) => updateField("emergencyContact", event.target.value)}
                  className={inputClass(getFieldError("emergencyContact"))}
                  placeholder={t("auth.signupPage.placeholders.emergencyContact")}
                />
                {getFieldError("emergencyContact") ? (
                  <p className="text-xs text-rose-300">{getFieldError("emergencyContact")}</p>
                ) : null}
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.password")}
                </span>
                <span className="relative block">
                  <Lock
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted",
                      inputIconClass,
                    )}
                  />
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className={cn(inputClass(getFieldError("password")), inputPadClass)}
                    placeholder={t("auth.signupPage.placeholders.password")}
                  />
                </span>
                {getFieldError("password") ? (
                  <p className="text-xs text-rose-300">{getFieldError("password")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.confirmPassword")}
                </span>
                <span className="relative block">
                  <Lock
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted",
                      inputIconClass,
                    )}
                  />
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    className={cn(
                      inputClass(getFieldError("confirmPassword")),
                      inputPadClass,
                    )}
                    placeholder={t("auth.signupPage.placeholders.confirmPassword")}
                  />
                </span>
                {getFieldError("confirmPassword") ? (
                  <p className="text-xs text-rose-300">{getFieldError("confirmPassword")}</p>
                ) : null}
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                {t("auth.signupPage.fields.profilePhoto")}
              </span>
              <input
                type="file"
                accept={AVATAR_FILE_INPUT_ACCEPT}
                onChange={handleProfileImageChange}
                className={inputClass(getFieldError("profileImage"))}
              />
              {hasImage ? (
                <p className="text-xs text-red-200">
                  {t("auth.signupPage.selectedFile", {
                    name: profileImage?.name ?? "",
                  })}
                </p>
              ) : (
                <p className="text-xs text-club-muted">
                  {t("auth.signupPage.profileHelp")}
                </p>
              )}
              {getFieldError("profileImage") ? (
                <p className="text-xs text-rose-300">{getFieldError("profileImage")}</p>
              ) : null}
            </label>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {warning ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ) : null}

            <button
              disabled={loading || submitState === "submitted"}
              type="submit"
              className="cn-btn cn-btn-primary w-full !py-3"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {submitState === "submitted"
                ? t("auth.signupPage.submitted")
                : loading
                  ? t("auth.signupPage.submitting")
                  : t("auth.signupPage.submit")}
            </button>
          </form>

          <div className="cn-hairline mt-6" />

          <Link
            href={`/${locale}`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-200 transition hover:text-red-100"
          >
            <ArrowLeft
              className={cn("h-3.5 w-3.5", dir === "rtl" ? "rotate-180" : "")}
            />
            {t("auth.signupPage.returnHome")}
          </Link>
        </section>
      </div>
    </main>
  );
}
