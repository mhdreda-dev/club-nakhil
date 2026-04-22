"use client";

import { Gender, Role, TrainingLevel, TrainingType } from "@prisma/client";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AvatarUploader } from "@/features/profiles/components/avatar-uploader";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import type { ProfileDTO } from "@/features/profiles/profiles.service";

type ProfileEditorProps = {
  profile: ProfileDTO;
};

const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const trainingLevelOptions: Array<{ value: TrainingLevel; label: string }> = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const trainingTypeOptions: Array<{ value: TrainingType; label: string }> = [
  { value: "CARDIO", label: "Cardio" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "SPARRING", label: "Sparring" },
  { value: "CONDITIONING", label: "Conditioning" },
];

type FieldErrorMap = Record<string, string>;

function inputClass(error?: string) {
  return `cn-input ${error ? "!border-rose-400/55" : ""}`;
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.fullName);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ?? "");
  const [gender, setGender] = useState<Gender | "">((profile.gender as Gender | null) ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [avatarPath, setAvatarPath] = useState(profile.avatarPath ?? "");

  const [specialization, setSpecialization] = useState(profile.coachProfile?.specialization ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    profile.coachProfile?.yearsOfExperience?.toString() ?? "",
  );
  const [certifications, setCertifications] = useState(
    profile.coachProfile?.certifications.join(", ") ?? "",
  );
  const [coachingStyle, setCoachingStyle] = useState(profile.coachProfile?.coachingStyle ?? "");
  const [achievements, setAchievements] = useState(profile.coachProfile?.achievements ?? "");

  const [memberTrainingLevel, setMemberTrainingLevel] = useState<TrainingLevel>(
    (profile.memberProfile?.trainingLevel as TrainingLevel | undefined) ?? "BEGINNER",
  );
  const [preferredTrainingType, setPreferredTrainingType] = useState<TrainingType | "">(
    (profile.memberProfile?.preferredTrainingType as TrainingType | null) ?? "",
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

  const hasCoachFields = profile.role === Role.COACH;
  const hasMemberFields = profile.role === Role.MEMBER;

  const statusBanner = useMemo(() => {
    if (error) {
      return (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      );
    }

    if (message) {
      return (
        <div className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      );
    }

    return null;
  }, [error, message]);

  function getFieldError(fieldPath: string) {
    return fieldErrors[fieldPath];
  }

  function handleAvatarUploaded(value: { avatarUrl: string; avatarPath: string }) {
    setAvatarUrl(value.avatarUrl);
    setAvatarPath(value.avatarPath);
    setError(null);
    setMessage("Avatar updated successfully.");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      fullName,
      displayName,
      phone,
      dateOfBirth,
      gender: gender || null,
      city,
      address,
      bio,
      emergencyContact,
    };

    if (hasCoachFields) {
      payload.coachProfile = {
        specialization,
        yearsOfExperience: yearsOfExperience.length ? Number(yearsOfExperience) : null,
        certifications: certifications
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        coachingStyle,
        achievements,
      };
    }

    if (hasMemberFields) {
      payload.memberProfile = {
        trainingLevel: memberTrainingLevel,
        preferredTrainingType: preferredTrainingType || null,
      };
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const issues = (responsePayload.issues as Array<{ path: string[]; message: string }> | undefined) ?? [];

      if (issues.length) {
        const mappedErrors: FieldErrorMap = {};
        for (const issue of issues) {
          if (issue.path.length) {
            mappedErrors[issue.path.join(".")] = issue.message;
          }
        }
        setFieldErrors(mappedErrors);
      }

      setError(responsePayload.message ?? "Unable to update profile.");
      setLoading(false);
      return;
    }

    setMessage("Profile updated successfully.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <ProfileSection
        title="Edit Profile"
        description="Update your identity, contact, and role-specific profile details."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Full Name</span>
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClass(getFieldError("fullName"))}
              placeholder="Your legal full name"
            />
            {getFieldError("fullName") ? (
              <p className="text-xs text-red-300">{getFieldError("fullName")}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Display Name</span>
            <input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={inputClass(getFieldError("displayName"))}
              placeholder="Name shown in dashboards"
            />
            {getFieldError("displayName") ? (
              <p className="text-xs text-red-300">{getFieldError("displayName")}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass(getFieldError("phone"))}
              placeholder="+212..."
            />
            {getFieldError("phone") ? <p className="text-xs text-red-300">{getFieldError("phone")}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Date of Birth</span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              className={inputClass(getFieldError("dateOfBirth"))}
            />
            {getFieldError("dateOfBirth") ? (
              <p className="text-xs text-red-300">{getFieldError("dateOfBirth")}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Gender</span>
            <select
              value={gender}
              onChange={(event) => setGender((event.target.value as Gender) || "")}
              className={inputClass(getFieldError("gender"))}
            >
              <option value="">Select gender</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">City</span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={inputClass(getFieldError("city"))}
              placeholder="Casablanca"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Address</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className={inputClass(getFieldError("address"))}
              placeholder="Street, district, city"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Bio</span>
            <textarea
              rows={3}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className={inputClass(getFieldError("bio"))}
              placeholder="Share a short profile summary"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Emergency Contact</span>
            <input
              value={emergencyContact}
              onChange={(event) => setEmergencyContact(event.target.value)}
              className={inputClass(getFieldError("emergencyContact"))}
              placeholder="Name + phone"
            />
          </label>
        </div>
      </ProfileSection>

      <ProfileSection title="Avatar Settings" description="Define your visual identity across Club Nakhil.">
        <AvatarUploader
          name={displayName || fullName}
          avatarUrl={avatarUrl || null}
          avatarPath={avatarPath || null}
          onUploaded={handleAvatarUploaded}
        />

        {getFieldError("avatarUrl") ? (
          <p className="mt-3 text-xs text-red-300">{getFieldError("avatarUrl")}</p>
        ) : null}
      </ProfileSection>

      {hasCoachFields ? (
        <ProfileSection title="Coach Profile" description="Highlight your coaching identity and background.">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Specialization</span>
              <input
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
                className={inputClass(getFieldError("coachProfile.specialization"))}
                placeholder="Technique, sparring, conditioning..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Years of Experience</span>
              <input
                type="number"
                min={0}
                max={70}
                value={yearsOfExperience}
                onChange={(event) => setYearsOfExperience(event.target.value)}
                className={inputClass(getFieldError("coachProfile.yearsOfExperience"))}
                placeholder="10"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Certifications</span>
              <input
                value={certifications}
                onChange={(event) => setCertifications(event.target.value)}
                className={inputClass(getFieldError("coachProfile.certifications"))}
                placeholder="Comma separated list"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Coaching Style</span>
              <textarea
                rows={3}
                value={coachingStyle}
                onChange={(event) => setCoachingStyle(event.target.value)}
                className={inputClass(getFieldError("coachProfile.coachingStyle"))}
                placeholder="How you structure sessions and motivate athletes"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Achievements</span>
              <textarea
                rows={3}
                value={achievements}
                onChange={(event) => setAchievements(event.target.value)}
                className={inputClass(getFieldError("coachProfile.achievements"))}
                placeholder="Titles, milestones, athlete outcomes"
              />
            </label>
          </div>
        </ProfileSection>
      ) : null}

      {hasMemberFields ? (
        <ProfileSection title="Member Preferences" description="Customize your training profile.">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Training Level</span>
              <select
                value={memberTrainingLevel}
                onChange={(event) => setMemberTrainingLevel(event.target.value as TrainingLevel)}
                className={inputClass(getFieldError("memberProfile.trainingLevel"))}
              >
                {trainingLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">Preferred Training Type</span>
              <select
                value={preferredTrainingType}
                onChange={(event) =>
                  setPreferredTrainingType((event.target.value as TrainingType) || "")
                }
                className={inputClass(getFieldError("memberProfile.preferredTrainingType"))}
              >
                <option value="">Not set</option>
                {trainingTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </ProfileSection>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={loading} type="submit" className="cn-btn cn-btn-primary">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? "Saving..." : "Save Profile"}
        </button>

        {statusBanner}
      </div>
    </form>
  );
}
