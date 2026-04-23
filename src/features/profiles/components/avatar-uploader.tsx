"use client";

import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_FILE_INPUT_ACCEPT,
  AVATAR_MAX_FILE_SIZE_BYTES,
  AVATAR_UPLOAD_FIELD,
} from "@/features/profiles/avatar.constants";
import { useTranslations } from "@/components/providers/translations-provider";
import { Avatar } from "@/components/ui/avatar";

type AvatarUploaderProps = {
  name: string;
  avatarUrl: string | null;
  avatarPath: string | null;
  onUploaded: (value: { avatarUrl: string; avatarPath: string }) => void;
};

const allowedMimeTypeSet = new Set<string>(AVATAR_ALLOWED_MIME_TYPES);

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AvatarUploader({
  name,
  avatarUrl,
  avatarPath,
  onUploaded,
}: AvatarUploaderProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveAvatarUrl = previewUrl ?? avatarUrl;

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return `${selectedFile.name} (${formatBytes(selectedFile.size)})`;
  }, [selectedFile]);

  const normalizeUploadError = (message: string | null) => {
    if (!message) {
      return null;
    }

    const normalized = message.toLowerCase();

    if (
      normalized.includes("bucket not found") ||
      normalized.includes("missing or inaccessible")
    ) {
      return t("profile.avatar.errors.bucketMissing");
    }

    return message;
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function resetSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setMessage(null);
    setError(null);

    if (!file) {
      resetSelection();
      return;
    }

    if (!allowedMimeTypeSet.has(file.type)) {
      setError(t("profile.avatar.errors.unsupportedFormat"));
      resetSelection();
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
      setError(
        t("profile.avatar.errors.maxSize", {
          size: formatBytes(AVATAR_MAX_FILE_SIZE_BYTES),
        }),
      );
      resetSelection();
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadAvatar() {
    if (!selectedFile) {
      setError(t("profile.avatar.errors.chooseImage"));
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set(AVATAR_UPLOAD_FIELD, selectedFile);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof payload.message === "string" ? payload.message : null;
        const details = typeof payload.details === "string" ? payload.details : null;
        const issues = Array.isArray(payload.issues) ? payload.issues.join(" ") : "";

        const combinedError = [message, details, issues]
          .filter((part): part is string => Boolean(part && part.trim().length))
          .join(" ");

        setError(
          normalizeUploadError(combinedError) ??
            t("profile.avatar.errors.uploadFailed"),
        );
        setUploading(false);
        return;
      }

      const uploadedAvatarUrl = payload.avatarUrl as string | undefined;
      const uploadedAvatarPath = payload.avatarPath as string | undefined;

      if (!uploadedAvatarUrl || !uploadedAvatarPath) {
        setError(t("profile.avatar.errors.metadataMissing"));
        setUploading(false);
        return;
      }

      onUploaded({
        avatarUrl: uploadedAvatarUrl,
        avatarPath: uploadedAvatarPath,
      });

      setMessage(t("profile.avatar.success"));
      resetSelection();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && error.message.length
          ? normalizeUploadError(error.message) ?? error.message
          : t("profile.avatar.errors.unavailable");
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
      <div className="mx-auto lg:mx-0">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-full bg-[conic-gradient(from_120deg,rgba(220,38,38,0.35),rgba(120,212,255,0.25),rgba(220,38,38,0.35))] opacity-60 blur-sm"
          />
          <Avatar
            name={name}
            avatarUrl={effectiveAvatarUrl}
            size="xl"
            className="relative h-24 w-24 border-red-200/40 shadow-[0_0_0_3px_rgba(220,38,38,0.2)]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_FILE_INPUT_ACCEPT}
          className="hidden"
          onChange={onFileChange}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openPicker}
            className="cn-btn cn-btn-ghost"
          >
            <Upload className="h-4 w-4" />
            {t("profile.avatar.actions.choose")}
          </button>

          <button
            type="button"
            onClick={uploadAvatar}
            disabled={!selectedFile || uploading}
            className="cn-btn cn-btn-primary"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading
              ? t("profile.avatar.actions.uploading")
              : t("profile.avatar.actions.upload")}
          </button>
        </div>

        {selectedFileSummary ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-200/85">
            {t("profile.avatar.selected")}{" "}
            <span className="text-white normal-case tracking-normal">{selectedFileSummary}</span>
          </p>
        ) : null}

        {avatarPath ? (
          <p className="truncate text-[11px] text-club-muted">
            {t("profile.avatar.current")}{" "}
            <span className="text-club-text-soft">{avatarPath}</span>
          </p>
        ) : null}

        <p className="text-[11px] text-club-muted">
          {t("profile.avatar.helpText", {
            size: formatBytes(AVATAR_MAX_FILE_SIZE_BYTES),
          })}
        </p>

        {error ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.12)]">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs text-red-100 shadow-[0_0_0_1px_rgba(220,38,38,0.12)]">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
