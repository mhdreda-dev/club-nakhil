"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ClubLogo } from "@/components/club-logo";
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_FILE_INPUT_ACCEPT,
  AVATAR_MAX_FILE_SIZE_BYTES,
} from "@/features/profiles/avatar.constants";

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

type RegistrationPayload = {
  ok?: boolean;
  message?: string;
  pending?: boolean;
  email?: string;
  warning?: string | null;
  warningCode?: "avatar-upload-failed" | null;
  fieldErrors?: FieldErrors;
  debug?: {
    step?: string;
    errorName?: string;
    message?: string;
    code?: string;
    clientVersion?: string | null;
    meta?: Record<string, unknown> | null;
  };
};

type SubmitState = "idle" | "submitting" | "submitted";
type RegistrationFieldKey = keyof RegistrationFormState | "profileImage";

const REGISTRATION_FETCH_TIMEOUT_MS = 15_000;

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const sportLevelOptions = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const membershipTypeOptions = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL", label: "Annual" },
];

const initialState: RegistrationFormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  gender: "",
  emergencyContact: "",
  sportLevel: "",
  membershipType: "",
};

const allowedAvatarMimeTypes = new Set<string>(AVATAR_ALLOWED_MIME_TYPES);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultFieldMessages: Record<RegistrationFieldKey, string> = {
  fullName: "Please enter your full name.",
  email: "Please enter a valid email address.",
  phone: "Please enter your phone number.",
  password: "Please create a password with at least 8 characters.",
  confirmPassword: "Passwords do not match.",
  dateOfBirth: "Please select your birth date.",
  gender: "Please choose your gender.",
  emergencyContact: "Please add an emergency contact.",
  sportLevel: "Please choose your skill level.",
  membershipType: "Please choose your membership plan.",
  profileImage: "Please upload a valid image under 3 MB.",
};

const signupHighlights = [
  "Premium member dashboard access after approval.",
  "Fast review for complete membership requests.",
  "Profile photo is optional and can be updated later.",
];

function inputClass(error?: string) {
  return `cn-input h-12 rounded-2xl border-white/12 bg-white/[0.03] px-4 text-sm text-white placeholder:text-slate-400 ${
    error
      ? "!border-rose-400/60 !bg-rose-500/10"
      : "hover:!border-white/20 focus-visible:!border-red-400/60"
  }`;
}

function selectClass(error?: string) {
  return `${inputClass(error)} appearance-none pr-11`;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function parseRegistrationResponse(response: Response): Promise<RegistrationPayload> {
  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text().catch(() => "");

  if (!rawBody.trim().length) {
    return {};
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody) as RegistrationPayload;
    } catch {
      return {
        message: "The server returned invalid JSON.",
      };
    }
  }

  try {
    return JSON.parse(rawBody) as RegistrationPayload;
  } catch {
    return {
      message: rawBody,
    };
  }
}

function humanizeFieldError(field: RegistrationFieldKey, message: string | undefined) {
  if (!message?.trim()) {
    return defaultFieldMessages[field];
  }

  const normalized = message.trim();
  const lowerMessage = normalized.toLowerCase();

  if (field === "profileImage") {
    return defaultFieldMessages.profileImage;
  }

  if (field === "confirmPassword" && lowerMessage.includes("match")) {
    return "Passwords do not match.";
  }

  if (field === "email" && lowerMessage.includes("already")) {
    return "An account with this email already exists.";
  }

  if (field === "email" && lowerMessage.includes("invalid")) {
    return defaultFieldMessages.email;
  }

  if (lowerMessage.includes("required")) {
    return defaultFieldMessages[field];
  }

  if (lowerMessage.includes("too small") || lowerMessage.includes("expected")) {
    return defaultFieldMessages[field];
  }

  return normalized;
}

function normalizeFieldErrors(fieldErrors?: FieldErrors) {
  if (!fieldErrors) {
    return {};
  }

  return Object.entries(fieldErrors).reduce<FieldErrors>((next, [key, value]) => {
    next[key] = humanizeFieldError(key as RegistrationFieldKey, value);
    return next;
  }, {});
}

function isGenericValidationMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  return (
    normalized.includes("highlighted fields") ||
    normalized === "validation failed." ||
    normalized === "validation failed" ||
    normalized === "invalid form submission." ||
    normalized === "invalid form submission"
  );
}

function getValidationSummary(fieldErrors: FieldErrors, fallback?: string | null) {
  const normalizedFallback = fallback?.trim();

  if (
    normalizedFallback &&
    !isGenericValidationMessage(normalizedFallback) &&
    normalizedFallback !== "Please review the required fields." &&
    normalizedFallback !== "Some information is missing or invalid." &&
    normalizedFallback !== "Passwords do not match." &&
    normalizedFallback !== "Please upload a valid image under 3 MB."
  ) {
    return normalizedFallback;
  }

  if (fieldErrors.profileImage) {
    return "Please upload a valid image under 3 MB.";
  }

  if (fieldErrors.confirmPassword?.toLowerCase().includes("match")) {
    return "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    const hasFormatIssue = Object.values(fieldErrors).some((message) => {
      const lowerMessage = message.toLowerCase();
      return (
        lowerMessage.includes("valid") ||
        lowerMessage.includes("at least") ||
        lowerMessage.includes("already exists") ||
        lowerMessage.includes("under 3 mb")
      );
    });

    return hasFormatIssue
      ? "Some information is missing or invalid."
      : "Please review the required fields.";
  }

  if (normalizedFallback) {
    return isGenericValidationMessage(normalizedFallback)
      ? "Please review the required fields."
      : normalizedFallback;
  }

  return "Some information is missing or invalid.";
}

function validateForm(form: RegistrationFormState, profileImage: File | null) {
  const nextErrors: FieldErrors = {};

  if (!form.fullName.trim()) {
    nextErrors.fullName = defaultFieldMessages.fullName;
  }

  if (!form.email.trim()) {
    nextErrors.email = "Please enter your email address.";
  } else if (!emailPattern.test(form.email.trim())) {
    nextErrors.email = defaultFieldMessages.email;
  }

  if (!form.phone.trim()) {
    nextErrors.phone = defaultFieldMessages.phone;
  }

  if (!form.dateOfBirth) {
    nextErrors.dateOfBirth = defaultFieldMessages.dateOfBirth;
  }

  if (!form.gender) {
    nextErrors.gender = defaultFieldMessages.gender;
  }

  if (!form.sportLevel) {
    nextErrors.sportLevel = defaultFieldMessages.sportLevel;
  }

  if (!form.membershipType) {
    nextErrors.membershipType = defaultFieldMessages.membershipType;
  }

  if (!form.emergencyContact.trim()) {
    nextErrors.emergencyContact = defaultFieldMessages.emergencyContact;
  }

  if (!form.password) {
    nextErrors.password = "Please create a password.";
  } else if (form.password.length < 8) {
    nextErrors.password = defaultFieldMessages.password;
  }

  if (!form.confirmPassword) {
    nextErrors.confirmPassword = "Please repeat your password.";
  } else if (form.confirmPassword !== form.password) {
    nextErrors.confirmPassword = defaultFieldMessages.confirmPassword;
  }

  if (profileImage) {
    if (!allowedAvatarMimeTypes.has(profileImage.type)) {
      nextErrors.profileImage = defaultFieldMessages.profileImage;
    }

    if (profileImage.size > AVATAR_MAX_FILE_SIZE_BYTES) {
      nextErrors.profileImage = defaultFieldMessages.profileImage;
    }
  }

  return {
    fieldErrors: nextErrors,
    message: getValidationSummary(nextErrors),
  };
}

export default function SignUpPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<RegistrationFormState>(initialState);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isDraggingProfileImage, setIsDraggingProfileImage] = useState(false);

  const hasImage = useMemo(() => profileImage !== null, [profileImage]);

  useEffect(() => {
    return () => {
      if (profileImagePreviewUrl) {
        URL.revokeObjectURL(profileImagePreviewUrl);
      }
    };
  }, [profileImagePreviewUrl]);

  function setFieldError(key: RegistrationFieldKey, message: string | null) {
    setFieldErrors((previous) => {
      const next = { ...previous };

      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }

      return next;
    });
  }

  function getFieldError(key: RegistrationFieldKey) {
    return fieldErrors[key];
  }

  function resetFeedback() {
    setError(null);
    setWarning(null);
    setSubmitState("idle");
  }

  function updateField<K extends keyof RegistrationFormState>(key: K, value: RegistrationFormState[K]) {
    resetFeedback();
    setFieldError(key, null);

    if (key === "password" || key === "confirmPassword") {
      setFieldError("confirmPassword", null);
    }

    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function clearProfileImageSelection() {
    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setProfileImage(null);
    setProfileImagePreviewUrl(null);
  }

  function applyProfileImageSelection(nextFile: File | null) {
    resetFeedback();
    setFieldError("profileImage", null);

    if (!nextFile) {
      clearProfileImageSelection();
      return;
    }

    if (!allowedAvatarMimeTypes.has(nextFile.type)) {
      clearProfileImageSelection();
      setFieldError("profileImage", defaultFieldMessages.profileImage);
      return;
    }

    if (nextFile.size > AVATAR_MAX_FILE_SIZE_BYTES) {
      clearProfileImageSelection();
      setFieldError("profileImage", defaultFieldMessages.profileImage);
      return;
    }

    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl);
    }

    setProfileImage(nextFile);
    setProfileImagePreviewUrl(URL.createObjectURL(nextFile));
  }

  function handleProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    applyProfileImageSelection(nextFile);
  }

  function openProfileImagePicker() {
    fileInputRef.current?.click();
  }

  function handleProfileImageDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingProfileImage(false);

    const nextFile = event.dataTransfer.files?.[0] ?? null;
    applyProfileImageSelection(nextFile);
  }

  function handleProfileImageKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProfileImagePicker();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    console.log("[signup] before validation", {
      hasProfileImage: Boolean(profileImage),
      email: form.email,
    });

    setError(null);
    setWarning(null);
    setFieldErrors({});

    const clientValidation = validateForm(form, profileImage);

    if (Object.keys(clientValidation.fieldErrors).length > 0) {
      setFieldErrors(clientValidation.fieldErrors);
      setError(clientValidation.message);
      return;
    }

    setLoading(true);
    setSubmitState("submitting");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, REGISTRATION_FETCH_TIMEOUT_MS);

    try {
      console.log("[signup] before building FormData");
      const formData = new FormData();

      for (const [key, value] of Object.entries(form)) {
        formData.set(key, value);
      }

      if (profileImage) {
        formData.set("profileImage", profileImage);
      }

      console.log("[signup] before fetch");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      console.log("[signup] after fetch resolves", {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
      });

      const payload = await parseRegistrationResponse(response);
      console.log("[signup] after reading response body", payload);

      if (!response.ok) {
        const nextFieldErrors = normalizeFieldErrors(payload.fieldErrors);
        setFieldErrors(nextFieldErrors);
        setSubmitState("idle");
        console.error("[signup] server error response", {
          status: response.status,
          message: payload.message,
          fieldErrors: nextFieldErrors,
          debug: payload.debug,
        });
        setError(getValidationSummary(nextFieldErrors, payload.message ?? null));
        return;
      }

      const targetEmail =
        typeof payload.email === "string" && payload.email.length
          ? payload.email
          : form.email;

      const params = new URLSearchParams({
        email: targetEmail,
      });

      if (payload.warningCode === "avatar-upload-failed") {
        params.set("warning", payload.warningCode);
      }

      setSubmitState("submitted");
      console.log("[signup] before redirect", {
        target: `/pending-approval?${params.toString()}`,
      });
      router.push(`/pending-approval?${params.toString()}`);
    } catch (submitError) {
      console.error("[signup] catch", submitError);
      setSubmitState("idle");

      const message =
        submitError instanceof DOMException && submitError.name === "AbortError"
          ? "Creating your account is taking longer than expected. Please try again."
          : submitError instanceof Error && submitError.message.length
            ? submitError.message
            : "We couldn't complete your registration right now. Please try again.";

      setError(message);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
      console.log("[signup] finally", {
        loadingReset: true,
      });
    }
  }

  const submitButtonIcon =
    submitState === "submitting" ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : submitState === "submitted" ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <UserPlus className="h-4 w-4" />
    );

  const submitButtonLabel =
    submitState === "submitting"
      ? "Creating Account..."
      : submitState === "submitted"
        ? "Registration Submitted"
        : "Create My Account";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_38%),linear-gradient(180deg,#070b12_0%,#0a111b_40%,#06080c_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 cn-grid-bg opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]"
      />

      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo />
          <span className="hidden rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-red-100 sm:inline-flex">
            Member Signup
          </span>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="cn-rise cn-surface-raised relative overflow-hidden rounded-[32px] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_40%)]"
            />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-red-100">
                <Sparkles className="h-3.5 w-3.5" />
                Club Nakhil
              </span>

              <div className="mt-6 flex items-center gap-4">
                <ClubLogo size={82} glow framed />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-100/80">
                    Self Registration
                  </p>
                  <h1 className="mt-2 font-heading text-3xl uppercase tracking-[0.05em] text-white sm:text-4xl">
                    Join the Club
                  </h1>
                </div>
              </div>

              <p className="mt-6 max-w-md text-sm leading-7 text-club-muted sm:text-[15px]">
                Create your Club Nakhil member account and send your membership request in one
                polished step. Once approved, you&apos;ll be ready to access your dashboard,
                sessions, and member updates.
              </p>

              <div className="mt-8 grid gap-3">
                {signupHighlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-200">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-6 text-slate-200">{highlight}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[28px] border border-red-400/18 bg-[linear-gradient(135deg,rgba(220,38,38,0.12),rgba(255,255,255,0.03))] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-red-100">
                  Membership Review
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  Complete every required field for the fastest approval. If you skip the profile
                  photo, your registration can still be submitted successfully.
                </p>
              </div>
            </div>
          </aside>

          <section className="cn-rise relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_30px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-300/45 to-transparent"
            />

            <div className="border-b border-white/8 px-5 py-6 sm:px-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-100/90">
                Member Registration
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Create your Club Nakhil account
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-club-muted">
                Fill in your details below. Your account will stay pending until the club team
                approves your membership.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
              {error ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Please review your registration details.</p>
                    <p className="mt-1 text-rose-100/85">{error}</p>
                  </div>
                </div>
              ) : null}

              {warning ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-2xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">A quick note about your registration.</p>
                    <p className="mt-1 text-amber-100/85">{warning}</p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-club-text-soft">
                    Personal Details
                  </p>
                  <div className="cn-hairline mt-3" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-semibold text-white">
                      Full Name
                    </label>
                    <span className="relative block">
                      <UserPlus className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                      <input
                        id="fullName"
                        required
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(event) => updateField("fullName", event.target.value)}
                        className={`${inputClass(getFieldError("fullName"))} !pl-11`}
                        placeholder="Enter your full name"
                        aria-invalid={Boolean(getFieldError("fullName"))}
                        aria-describedby={getFieldError("fullName") ? "fullName-error" : undefined}
                      />
                    </span>
                    {getFieldError("fullName") ? (
                      <p id="fullName-error" className="text-xs text-rose-300">
                        {getFieldError("fullName")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-white">
                      Email Address
                    </label>
                    <span className="relative block">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                      <input
                        id="email"
                        required
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        className={`${inputClass(getFieldError("email"))} !pl-11`}
                        placeholder="Enter your email"
                        aria-invalid={Boolean(getFieldError("email"))}
                        aria-describedby={getFieldError("email") ? "email-error" : undefined}
                      />
                    </span>
                    {getFieldError("email") ? (
                      <p id="email-error" className="text-xs text-rose-300">
                        {getFieldError("email")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-white">
                      Phone Number
                    </label>
                    <span className="relative block">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                      <input
                        id="phone"
                        required
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        className={`${inputClass(getFieldError("phone"))} !pl-11`}
                        placeholder="Enter phone number"
                        aria-invalid={Boolean(getFieldError("phone"))}
                        aria-describedby={getFieldError("phone") ? "phone-error" : undefined}
                      />
                    </span>
                    {getFieldError("phone") ? (
                      <p id="phone-error" className="text-xs text-rose-300">
                        {getFieldError("phone")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dateOfBirth" className="text-sm font-semibold text-white">
                      Date of Birth
                    </label>
                    <span className="relative block">
                      <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                      <input
                        id="dateOfBirth"
                        required
                        type="date"
                        autoComplete="bday"
                        value={form.dateOfBirth}
                        onChange={(event) => updateField("dateOfBirth", event.target.value)}
                        className={`${inputClass(getFieldError("dateOfBirth"))} !pl-11`}
                        placeholder="Select your birth date"
                        aria-invalid={Boolean(getFieldError("dateOfBirth"))}
                        aria-describedby={getFieldError("dateOfBirth") ? "dateOfBirth-error" : undefined}
                      />
                    </span>
                    {getFieldError("dateOfBirth") ? (
                      <p id="dateOfBirth-error" className="text-xs text-rose-300">
                        {getFieldError("dateOfBirth")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-semibold text-white">
                      Gender
                    </label>
                    <span className="relative block">
                      <select
                        id="gender"
                        required
                        value={form.gender}
                        onChange={(event) => updateField("gender", event.target.value)}
                        className={selectClass(getFieldError("gender"))}
                        aria-invalid={Boolean(getFieldError("gender"))}
                        aria-describedby={getFieldError("gender") ? "gender-error" : undefined}
                      >
                        <option value="" disabled>
                          Choose gender
                        </option>
                        {genderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                    </span>
                    {getFieldError("gender") ? (
                      <p id="gender-error" className="text-xs text-rose-300">
                        {getFieldError("gender")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="sportLevel" className="text-sm font-semibold text-white">
                      Skill Level
                    </label>
                    <span className="relative block">
                      <select
                        id="sportLevel"
                        required
                        value={form.sportLevel}
                        onChange={(event) => updateField("sportLevel", event.target.value)}
                        className={selectClass(getFieldError("sportLevel"))}
                        aria-invalid={Boolean(getFieldError("sportLevel"))}
                        aria-describedby={getFieldError("sportLevel") ? "sportLevel-error" : undefined}
                      >
                        <option value="" disabled>
                          Choose level
                        </option>
                        {sportLevelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                    </span>
                    {getFieldError("sportLevel") ? (
                      <p id="sportLevel-error" className="text-xs text-rose-300">
                        {getFieldError("sportLevel")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="membershipType" className="text-sm font-semibold text-white">
                      Membership Plan
                    </label>
                    <span className="relative block">
                      <select
                        id="membershipType"
                        required
                        value={form.membershipType}
                        onChange={(event) => updateField("membershipType", event.target.value)}
                        className={selectClass(getFieldError("membershipType"))}
                        aria-invalid={Boolean(getFieldError("membershipType"))}
                        aria-describedby={
                          getFieldError("membershipType") ? "membershipType-error" : undefined
                        }
                      >
                        <option value="" disabled>
                          Choose membership
                        </option>
                        {membershipTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                    </span>
                    {getFieldError("membershipType") ? (
                      <p id="membershipType-error" className="text-xs text-rose-300">
                        {getFieldError("membershipType")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="emergencyContact" className="text-sm font-semibold text-white">
                      Emergency Contact
                    </label>
                    <span className="relative block">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                      <input
                        id="emergencyContact"
                        required
                        autoComplete="off"
                        value={form.emergencyContact}
                        onChange={(event) => updateField("emergencyContact", event.target.value)}
                        className={`${inputClass(getFieldError("emergencyContact"))} !pl-11`}
                        placeholder="Emergency contact name / phone"
                        aria-invalid={Boolean(getFieldError("emergencyContact"))}
                        aria-describedby={
                          getFieldError("emergencyContact") ? "emergencyContact-error" : undefined
                        }
                      />
                    </span>
                    {getFieldError("emergencyContact") ? (
                      <p id="emergencyContact-error" className="text-xs text-rose-300">
                        {getFieldError("emergencyContact")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-club-text-soft">
                    Security
                  </p>
                  <div className="cn-hairline mt-3" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold text-white">
                      Password
                    </label>
                    <span className="relative block">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                      <input
                        id="password"
                        required
                        type="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        className={`${inputClass(getFieldError("password"))} !pl-11`}
                        placeholder="Create password"
                        aria-invalid={Boolean(getFieldError("password"))}
                        aria-describedby={getFieldError("password") ? "password-error" : "password-hint"}
                      />
                    </span>
                    <p id="password-hint" className="text-xs text-club-muted">
                      Use at least 8 characters.
                    </p>
                    {getFieldError("password") ? (
                      <p id="password-error" className="text-xs text-rose-300">
                        {getFieldError("password")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-white">
                      Confirm Password
                    </label>
                    <span className="relative block">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                      <input
                        id="confirmPassword"
                        required
                        type="password"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={(event) => updateField("confirmPassword", event.target.value)}
                        className={`${inputClass(getFieldError("confirmPassword"))} !pl-11`}
                        placeholder="Repeat password"
                        aria-invalid={Boolean(getFieldError("confirmPassword"))}
                        aria-describedby={
                          getFieldError("confirmPassword") ? "confirmPassword-error" : undefined
                        }
                      />
                    </span>
                    {getFieldError("confirmPassword") ? (
                      <p id="confirmPassword-error" className="text-xs text-rose-300">
                        {getFieldError("confirmPassword")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-club-text-soft">
                    Profile Photo
                  </p>
                  <div className="cn-hairline mt-3" />
                </div>

                <div className="space-y-3">
                  <label htmlFor="profileImage" className="text-sm font-semibold text-white">
                    Profile Photo (Optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    id="profileImage"
                    type="file"
                    accept={AVATAR_FILE_INPUT_ACCEPT}
                    onChange={handleProfileImageChange}
                    className="sr-only"
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openProfileImagePicker}
                    onKeyDown={handleProfileImageKeyDown}
                    onDrop={handleProfileImageDrop}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                      setIsDraggingProfileImage(true);
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDraggingProfileImage(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      if (event.currentTarget === event.target) {
                        setIsDraggingProfileImage(false);
                      }
                    }}
                    aria-describedby={getFieldError("profileImage") ? "profileImage-error" : "profileImage-hint"}
                    className={`group rounded-[28px] border border-dashed p-5 transition duration-200 sm:p-6 ${
                      getFieldError("profileImage")
                        ? "border-rose-400/45 bg-rose-500/8"
                        : isDraggingProfileImage
                          ? "border-red-300/45 bg-red-500/10 shadow-[0_18px_50px_rgba(220,38,38,0.18)]"
                          : "border-white/12 bg-white/[0.03] hover:border-red-300/35 hover:bg-red-500/[0.05]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-100">
                          {hasImage ? <Camera className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                        </span>

                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">
                            {isDraggingProfileImage
                              ? "Drop your photo here"
                              : hasImage
                                ? "Photo selected"
                                : "Drag and drop your photo here"}
                          </p>
                          <p id="profileImage-hint" className="text-sm text-club-muted">
                            {hasImage
                              ? "You can replace it anytime before submitting."
                              : "Or browse your device. JPG, PNG, or WEBP up to 3 MB."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openProfileImagePicker();
                        }}
                        className="cn-btn cn-btn-ghost !rounded-2xl !px-4 !py-2.5"
                      >
                        <Upload className="h-4 w-4" />
                        {hasImage ? "Replace Image" : "Browse Files"}
                      </button>
                    </div>

                    {hasImage ? (
                      <div className="mt-5 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          {profileImagePreviewUrl ? (
                            <img
                              src={profileImagePreviewUrl}
                              alt="Selected profile preview"
                              className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                            />
                          ) : null}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {profileImage?.name}
                            </p>
                            <p className="mt-1 text-xs text-red-100/80">
                              {profileImage ? formatBytes(profileImage.size) : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            clearProfileImageSelection();
                            resetFeedback();
                            setFieldError("profileImage", null);
                          }}
                          className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-300/35 hover:bg-rose-500/10 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                          Remove Image
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {getFieldError("profileImage") ? (
                    <p id="profileImage-error" className="text-xs text-rose-300">
                      {getFieldError("profileImage")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  disabled={loading}
                  type="submit"
                  className="cn-btn cn-btn-primary h-14 w-full !rounded-2xl !py-3.5 text-sm sm:text-[15px]"
                >
                  {submitButtonIcon}
                  {submitButtonLabel}
                </button>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-4 text-sm text-club-muted sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 font-semibold text-slate-200 transition hover:text-white"
                  >
                    Already have an account? Sign in
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 font-semibold text-red-200 transition hover:text-red-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </div>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
