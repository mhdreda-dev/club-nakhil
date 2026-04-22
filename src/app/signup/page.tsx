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
import { AVATAR_FILE_INPUT_ACCEPT } from "@/features/profiles/avatar.constants";

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
  gender: "MALE",
  emergencyContact: "",
  sportLevel: "BEGINNER",
  membershipType: "MONTHLY",
};

function inputClass(error?: string) {
  return `cn-input ${error ? "!border-rose-400/55" : ""}`;
}

export default function SignUpPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegistrationFormState>(initialState);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const hasImage = useMemo(() => profileImage !== null, [profileImage]);

  function updateField<K extends keyof RegistrationFormState>(key: K, value: RegistrationFormState[K]) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function getFieldError(key: keyof RegistrationFormState | "profileImage") {
    return fieldErrors[key];
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    setFieldErrors({});

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
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setFieldErrors((payload.fieldErrors as FieldErrors | undefined) ?? {});
      setError(payload.message ?? "Unable to complete sign up.");
      setLoading(false);
      return;
    }

    if (payload.warning) {
      setWarning(payload.warning as string);
    }

    const targetEmail =
      typeof payload.email === "string" && payload.email.length
        ? payload.email
        : form.email;

    router.push(`/pending-approval?email=${encodeURIComponent(targetEmail)}`);
    router.refresh();
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
        <div className="flex items-center justify-between gap-3">
          <BrandLogo />
          <Link
            href="/login"
            className="cn-btn cn-btn-ghost"
          >
            Already registered? Login
          </Link>
        </div>

        <section className="mt-8 cn-rise rounded-3xl border border-white/10 bg-club-surface/85 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-center gap-4">
            <ClubLogo size={76} glow framed />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/35 bg-red-500/12 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-red-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Self-Registration
              </span>
              <h1 className="mt-3 font-heading text-3xl uppercase tracking-[0.05em] text-white">
                Become a Club Nakhil Member
              </h1>
              <p className="mt-1 text-sm text-club-muted">
                Create your member account. Access will be activated after admin approval.
              </p>
            </div>
          </div>

          <div className="cn-hairline my-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Full Name
                </span>
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className={inputClass(getFieldError("fullName"))}
                  placeholder="Your full legal name"
                />
                {getFieldError("fullName") ? (
                  <p className="text-xs text-rose-300">{getFieldError("fullName")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Email
                </span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className={`${inputClass(getFieldError("email"))} !pl-10`}
                    placeholder="you@clubnakhil.ma"
                  />
                </span>
                {getFieldError("email") ? (
                  <p className="text-xs text-rose-300">{getFieldError("email")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Phone
                </span>
                <span className="relative block">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className={`${inputClass(getFieldError("phone"))} !pl-10`}
                    placeholder="+212..."
                  />
                </span>
                {getFieldError("phone") ? (
                  <p className="text-xs text-rose-300">{getFieldError("phone")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Date of Birth
                </span>
                <span className="relative block">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                  <input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => updateField("dateOfBirth", event.target.value)}
                    className={`${inputClass(getFieldError("dateOfBirth"))} !pl-10`}
                  />
                </span>
                {getFieldError("dateOfBirth") ? (
                  <p className="text-xs text-rose-300">{getFieldError("dateOfBirth")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Gender
                </span>
                <select
                  value={form.gender}
                  onChange={(event) => updateField("gender", event.target.value)}
                  className={inputClass(getFieldError("gender"))}
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {getFieldError("gender") ? (
                  <p className="text-xs text-rose-300">{getFieldError("gender")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Sport Level
                </span>
                <select
                  value={form.sportLevel}
                  onChange={(event) => updateField("sportLevel", event.target.value)}
                  className={inputClass(getFieldError("sportLevel"))}
                >
                  {sportLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {getFieldError("sportLevel") ? (
                  <p className="text-xs text-rose-300">{getFieldError("sportLevel")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Membership Type
                </span>
                <select
                  value={form.membershipType}
                  onChange={(event) => updateField("membershipType", event.target.value)}
                  className={inputClass(getFieldError("membershipType"))}
                >
                  {membershipTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {getFieldError("membershipType") ? (
                  <p className="text-xs text-rose-300">{getFieldError("membershipType")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Emergency Contact
                </span>
                <input
                  required
                  value={form.emergencyContact}
                  onChange={(event) => updateField("emergencyContact", event.target.value)}
                  className={inputClass(getFieldError("emergencyContact"))}
                  placeholder="Name + phone number"
                />
                {getFieldError("emergencyContact") ? (
                  <p className="text-xs text-rose-300">{getFieldError("emergencyContact")}</p>
                ) : null}
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Password
                </span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className={`${inputClass(getFieldError("password"))} !pl-10`}
                    placeholder="Minimum 8 characters"
                  />
                </span>
                {getFieldError("password") ? (
                  <p className="text-xs text-rose-300">{getFieldError("password")}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  Confirm Password
                </span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    className={`${inputClass(getFieldError("confirmPassword"))} !pl-10`}
                    placeholder="Repeat password"
                  />
                </span>
                {getFieldError("confirmPassword") ? (
                  <p className="text-xs text-rose-300">{getFieldError("confirmPassword")}</p>
                ) : null}
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                Profile Image (Optional)
              </span>
              <input
                type="file"
                accept={AVATAR_FILE_INPUT_ACCEPT}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setProfileImage(nextFile);
                }}
                className={inputClass(getFieldError("profileImage"))}
              />
              {hasImage ? (
                <p className="text-xs text-red-200">Selected file: {profileImage?.name}</p>
              ) : (
                <p className="text-xs text-club-muted">JPG, PNG, or WEBP (max 3 MB).</p>
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
              disabled={loading}
              type="submit"
              className="cn-btn cn-btn-primary w-full !py-3"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Submitting registration…" : "Create Member Account"}
            </button>
          </form>

          <div className="cn-hairline mt-6" />

          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-200 transition hover:text-red-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to home
          </Link>
        </section>
      </div>
    </main>
  );
}
