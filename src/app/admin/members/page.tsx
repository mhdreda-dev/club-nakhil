"use client";

import {
  AccountStatus,
  Gender,
  MembershipType,
  TrainingLevel,
} from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  Search,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useTranslations } from "@/components/providers/translations-provider";
import { SectionHeader } from "@/components/sports/section-header";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import {
  getIntlLocale,
  translateAccountStatus,
  translateGender,
  translateMembershipType,
  translateTrainingLevel,
} from "@/lib/i18n";

type FieldErrors = Record<string, string>;

type MemberStatus = `${AccountStatus}`;
type StatusFilter = "ALL" | MemberStatus;

type MemberRecord = {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  status: MemberStatus;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  sportLevel: string | null;
  membershipType: string | null;
  profileImage: string | null;
  overallRating: number;
  currentRank: number | null;
  createdAt: string;
  updatedAt: string;
};

type MembersResponse = {
  members: MemberRecord[];
  stats: {
    total: number;
    pending: number;
    active: number;
    blocked: number;
  };
};

type ManualFormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
  emergencyContact: string;
  sportLevel: TrainingLevel;
  membershipType: MembershipType;
  status: AccountStatus;
  profileImage: string;
};

type ToastItem = {
  id: string;
  kind: "success" | "error";
  message: string;
};

const statusFilters: StatusFilter[] = ["ALL", "PENDING", "ACTIVE", "BLOCKED"];

const statusPriority: Record<MemberStatus, number> = {
  PENDING: 0,
  ACTIVE: 1,
  BLOCKED: 2,
};

const initialManualForm: ManualFormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  gender: Gender.MALE,
  address: "",
  emergencyContact: "",
  sportLevel: TrainingLevel.BEGINNER,
  membershipType: MembershipType.MONTHLY,
  status: AccountStatus.ACTIVE,
  profileImage: "",
};

function inputClass(error?: string) {
  return `cn-input ${error ? "!border-rose-400/55" : ""}`;
}

function tagToneByStatus(status: MemberStatus): "gold" | "green" | "rose" {
  if (status === "PENDING") return "gold";
  if (status === "ACTIVE") return "green";
  return "rose";
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return null;
  }

  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function formatRegistrationDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function AdminMembersPage() {
  const searchParams = useSearchParams();
  const { locale, t } = useTranslations();
  const intlLocale = getIntlLocale(locale);

  const initialFilter = useMemo<StatusFilter>(() => {
    const status = searchParams.get("status");

    if (status === "PENDING" || status === "ACTIVE" || status === "BLOCKED") {
      return status;
    }

    return "ALL";
  }, [searchParams]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [stats, setStats] = useState<MembersResponse["stats"]>({
    total: 0,
    pending: 0,
    active: 0,
    blocked: 0,
  });

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ id: string; action: string } | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [manualForm, setManualForm] = useState<ManualFormState>(initialManualForm);

  const [confirmRejectMember, setConfirmRejectMember] = useState<MemberRecord | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((kind: ToastItem["kind"], message: string) => {
    const toast: ToastItem = {
      id: crypto.randomUUID(),
      kind,
      message,
    };

    setToasts((previous) => [...previous, toast]);

    setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== toast.id));
    }, 2600);
  }, []);

  const loadMembers = useCallback(
    async (filter: StatusFilter, search: string) => {
      const query = new URLSearchParams();

      if (filter !== "ALL") {
        query.set("status", filter);
      }

      if (search.trim().length) {
        query.set("search", search.trim());
      }

      const response = await fetch(`/api/admin/members?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<MembersResponse> & {
        message?: string;
      };

      if (!response.ok) {
        setError(payload.message ?? t("pages.adminMembers.errors.load"));
        setLoadingMembers(false);
        return;
      }

      setError(null);
      setMembers(payload.members ?? []);
      if (payload.stats) {
        setStats(payload.stats);
      }
      setLoadingMembers(false);
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers(statusFilter, debouncedSearch).catch((loadError) => {
      console.error(loadError);
      setError(t("pages.adminMembers.errors.load"));
      setLoadingMembers(false);
    });
  }, [statusFilter, debouncedSearch, loadMembers]);

  const sortedMembers = useMemo(
    () =>
      [...members].sort((left, right) => {
        const statusDiff = statusPriority[left.status] - statusPriority[right.status];

        if (statusDiff !== 0) {
          return statusDiff;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [members],
  );

  async function applyMemberStatus(member: MemberRecord, status: AccountStatus) {
    setActionLoading({
      id: member.id,
      action: status,
    });
    setError(null);

    const response = await fetch(`/api/admin/members/${member.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? t("pages.adminMembers.errors.updateStatus"));
      pushToast("error", payload.message ?? t("pages.adminMembers.errors.updateStatus"));
      setActionLoading(null);
      return;
    }

    setLoadingMembers(true);
    await loadMembers(statusFilter, debouncedSearch);
    setActionLoading(null);

    if (status === AccountStatus.ACTIVE && member.status === "PENDING") {
      pushToast("success", t("pages.adminMembers.success.approved"));
      return;
    }

    if (status === AccountStatus.BLOCKED) {
      pushToast("success", t("pages.adminMembers.success.blocked"));
      return;
    }

    pushToast("success", payload.message ?? t("pages.adminMembers.success.updated"));
  }

  async function rejectPendingMember(member: MemberRecord) {
    setActionLoading({ id: member.id, action: "REJECT" });
    setError(null);

    const response = await fetch(`/api/admin/members/${member.id}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? t("pages.adminMembers.errors.reject"));
      pushToast("error", payload.message ?? t("pages.adminMembers.errors.reject"));
      setActionLoading(null);
      return;
    }

    setConfirmRejectMember(null);
    setLoadingMembers(true);
    await loadMembers(statusFilter, debouncedSearch);
    setActionLoading(null);
    pushToast("success", t("pages.adminMembers.success.rejected"));
  }

  async function handleManualCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateLoading(true);
    setError(null);
    setFieldErrors({});

    if (manualForm.password !== manualForm.confirmPassword) {
      setFieldErrors({
        confirmPassword: t("pages.adminMembers.errors.passwordMismatch"),
      });
      setCreateLoading(false);
      return;
    }

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: manualForm.fullName,
        email: manualForm.email,
        phone: manualForm.phone,
        password: manualForm.password,
        dateOfBirth: manualForm.dateOfBirth,
        gender: manualForm.gender,
        address: manualForm.address,
        emergencyContact: manualForm.emergencyContact,
        sportLevel: manualForm.sportLevel,
        membershipType: manualForm.membershipType,
        status: manualForm.status,
        profileImage: manualForm.profileImage,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      fieldErrors?: FieldErrors;
    };

    if (!response.ok) {
      if (payload.fieldErrors) {
        setFieldErrors(payload.fieldErrors);
      }
      setError(payload.message ?? t("pages.adminMembers.errors.create"));
      pushToast("error", payload.message ?? t("pages.adminMembers.errors.create"));
      setCreateLoading(false);
      return;
    }

    setManualForm(initialManualForm);
    setCreateLoading(false);
    setLoadingMembers(true);
    await loadMembers(statusFilter, debouncedSearch);
    pushToast("success", payload.message ?? t("pages.adminMembers.success.created"));
  }

  const pendingVisibleCount = sortedMembers.filter((member) => member.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("pages.adminMembers.eyebrow")}
        title={t("pages.adminMembers.title")}
        subtitle={t("pages.adminMembers.subtitle")}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/35 bg-rose-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-100">
            <Users className="h-3.5 w-3.5" />
            {t("pages.adminMembers.pendingBadge", { count: stats.pending })}
          </span>
        }
      />

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1.05fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <h2 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">
                {t("pages.adminMembers.queueTitle")}
            </h2>
            <p className="mt-1 text-sm text-club-muted">
                {t("pages.adminMembers.queueSubtitle")}
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-club-muted">
            {t("pages.adminMembers.showing", { count: sortedMembers.length })}
          </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted" />
              <input
                value={searchInput}
                onChange={(event) => {
                  setLoadingMembers(true);
                  setSearchInput(event.target.value);
                }}
                className="cn-input !ps-10"
                placeholder={t("pages.adminMembers.searchPlaceholder")}
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setLoadingMembers(true);
                    setStatusFilter(filter);
                  }}
                  className={
                    filter === statusFilter
                      ? "cn-btn cn-btn-primary !px-3 !py-2 text-xs"
                      : "cn-btn cn-btn-ghost !px-3 !py-2 text-xs"
                  }
                >
                  {filter === "ALL" ? t("pages.adminMembers.filterAll") : translateAccountStatus(t, filter)}
                </button>
              ))}
            </div>
          </div>

          {loadingMembers ? (
            <div className="mt-6 flex justify-center py-10 text-club-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="cn-empty-state mt-5">
              <Users className="h-8 w-8 opacity-30" />
              <p>{t("pages.adminMembers.empty")}</p>
            </div>
          ) : (
            <>
              <div className="mt-5 hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1120px] table-auto border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-club-muted">
                      <th className="px-3 py-2">{t("pages.adminMembers.table.member")}</th>
                      <th className="px-3 py-2">{t("pages.adminMembers.table.phone")}</th>
                      <th className="px-3 py-2">{t("pages.adminMembers.table.registered")}</th>
                      <th className="px-3 py-2">{t("pages.adminMembers.table.level")}</th>
                      <th className="px-3 py-2">{t("pages.adminMembers.table.membership")}</th>
                      <th className="px-3 py-2">{t("pages.adminMembers.table.age")}</th>
                      <th className="px-3 py-2">{t("pages.adminMembers.table.status")}</th>
                      <th className="px-3 py-2 text-right">{t("pages.adminMembers.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMembers.map((member) => {
                      const age = calculateAge(member.dateOfBirth);
                      const isPending = member.status === "PENDING";

                      return (
                        <tr
                          key={member.id}
                          className={
                            isPending
                              ? "border-b border-amber-300/15 bg-amber-500/5"
                              : "border-b border-white/6"
                          }
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={member.displayName} avatarUrl={member.profileImage} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">{member.displayName}</p>
                                <p className="truncate text-xs text-club-muted">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-club-text-soft">{member.phone ?? "-"}</td>
                          <td className="px-3 py-3 text-xs text-club-muted">{formatRegistrationDate(member.createdAt, intlLocale)}</td>
                          <td className="px-3 py-3 text-club-text-soft">{member.sportLevel ? translateTrainingLevel(t, member.sportLevel) : "-"}</td>
                          <td className="px-3 py-3 text-club-text-soft">{member.membershipType ? translateMembershipType(t, member.membershipType) : "-"}</td>
                          <td className="px-3 py-3 text-club-text-soft">{age !== null ? `${age}` : "-"}</td>
                          <td className="px-3 py-3">
                            <Tag label={translateAccountStatus(t, member.status)} tone={tagToneByStatus(member.status)} />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {member.status === "PENDING" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => applyMemberStatus(member, AccountStatus.ACTIVE)}
                                    disabled={actionLoading?.id === member.id}
                                    className="cn-btn cn-btn-primary !px-2.5 !py-1.5 text-xs"
                                  >
                                    {actionLoading?.id === member.id && actionLoading.action === AccountStatus.ACTIVE ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    )}
                                    {t("pages.adminMembers.actions.approve")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => applyMemberStatus(member, AccountStatus.BLOCKED)}
                                    disabled={actionLoading?.id === member.id}
                                    className="cn-btn cn-btn-danger !px-2.5 !py-1.5 text-xs"
                                  >
                                    <ShieldBan className="h-3.5 w-3.5" />
                                    {t("pages.adminMembers.actions.block")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRejectMember(member)}
                                    disabled={actionLoading?.id === member.id}
                                    className="cn-btn cn-btn-ghost !px-2.5 !py-1.5 text-xs"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("pages.adminMembers.actions.reject")}
                                  </button>
                                </>
                              ) : member.status === "ACTIVE" ? (
                                <button
                                  type="button"
                                  onClick={() => applyMemberStatus(member, AccountStatus.BLOCKED)}
                                  disabled={actionLoading?.id === member.id}
                                  className="cn-btn cn-btn-danger !px-2.5 !py-1.5 text-xs"
                                >
                                  <ShieldBan className="h-3.5 w-3.5" />
                                  {t("pages.adminMembers.actions.block")}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => applyMemberStatus(member, AccountStatus.ACTIVE)}
                                  disabled={actionLoading?.id === member.id}
                                  className="cn-btn cn-btn-outline !px-2.5 !py-1.5 text-xs"
                                >
                                  {t("pages.adminMembers.actions.activate")}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedMember(member)}
                                className="cn-btn cn-btn-ghost !px-2.5 !py-1.5 text-xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {t("pages.adminMembers.actions.view")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 space-y-3 xl:hidden">
                {sortedMembers.map((member) => {
                  const age = calculateAge(member.dateOfBirth);

                  return (
                    <article
                      key={member.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={member.displayName} avatarUrl={member.profileImage} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{member.displayName}</p>
                            <p className="truncate text-xs text-club-muted">{member.email}</p>
                          </div>
                        </div>
                        <Tag label={translateAccountStatus(t, member.status)} tone={tagToneByStatus(member.status)} />
                      </div>

                      <div className="mt-2 grid gap-1 text-xs text-club-muted">
                        <p>{t("pages.adminMembers.mobile.phone")}: {member.phone ?? "-"}</p>
                        <p>{t("pages.adminMembers.mobile.registered")}: {formatRegistrationDate(member.createdAt, intlLocale)}</p>
                        <p>{t("pages.adminMembers.mobile.level")}: {member.sportLevel ? translateTrainingLevel(t, member.sportLevel) : "-"}</p>
                        <p>{t("pages.adminMembers.mobile.membership")}: {member.membershipType ? translateMembershipType(t, member.membershipType) : "-"}</p>
                        <p>{t("pages.adminMembers.mobile.age")}: {age !== null ? `${age}` : "-"}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.status === "PENDING" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => applyMemberStatus(member, AccountStatus.ACTIVE)}
                              disabled={actionLoading?.id === member.id}
                              className="cn-btn cn-btn-primary !px-2.5 !py-1.5 text-xs"
                            >
                              {t("pages.adminMembers.actions.approve")}
                            </button>
                            <button
                              type="button"
                              onClick={() => applyMemberStatus(member, AccountStatus.BLOCKED)}
                              disabled={actionLoading?.id === member.id}
                              className="cn-btn cn-btn-danger !px-2.5 !py-1.5 text-xs"
                            >
                              {t("pages.adminMembers.actions.block")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRejectMember(member)}
                              disabled={actionLoading?.id === member.id}
                              className="cn-btn cn-btn-ghost !px-2.5 !py-1.5 text-xs"
                            >
                              {t("pages.adminMembers.actions.reject")}
                            </button>
                          </>
                        ) : member.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => applyMemberStatus(member, AccountStatus.BLOCKED)}
                            disabled={actionLoading?.id === member.id}
                            className="cn-btn cn-btn-danger !px-2.5 !py-1.5 text-xs"
                          >
                            {t("pages.adminMembers.actions.block")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => applyMemberStatus(member, AccountStatus.ACTIVE)}
                            disabled={actionLoading?.id === member.id}
                            className="cn-btn cn-btn-outline !px-2.5 !py-1.5 text-xs"
                          >
                            {t("pages.adminMembers.actions.activate")}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedMember(member)}
                          className="cn-btn cn-btn-ghost !px-2.5 !py-1.5 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t("pages.adminMembers.actions.viewProfile")}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card>
          <h2 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">
            {t("pages.adminMembers.manual.title")}
          </h2>
          <p className="mt-1 text-sm text-club-muted">
            {t("pages.adminMembers.manual.subtitle")}
          </p>

          <form onSubmit={handleManualCreate} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("profile.editor.fields.fullName")}</span>
                <input
                  required
                  value={manualForm.fullName}
                  onChange={(event) =>
                    setManualForm((previous) => ({ ...previous, fullName: event.target.value }))
                  }
                  className={inputClass(fieldErrors.fullName)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("auth.email")}</span>
                <input
                  required
                  type="email"
                  value={manualForm.email}
                  onChange={(event) =>
                    setManualForm((previous) => ({ ...previous, email: event.target.value }))
                  }
                  className={inputClass(fieldErrors.email)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("profile.editor.fields.phone")}</span>
                <input
                  required
                  value={manualForm.phone}
                  onChange={(event) =>
                    setManualForm((previous) => ({ ...previous, phone: event.target.value }))
                  }
                  className={inputClass(fieldErrors.phone)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("profile.editor.fields.dateOfBirth")}</span>
                <input
                  required
                  type="date"
                  value={manualForm.dateOfBirth}
                  onChange={(event) =>
                    setManualForm((previous) => ({ ...previous, dateOfBirth: event.target.value }))
                  }
                  className={inputClass(fieldErrors.dateOfBirth)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("auth.password")}</span>
                <input
                  required
                  type="password"
                  value={manualForm.password}
                  onChange={(event) =>
                    setManualForm((previous) => ({ ...previous, password: event.target.value }))
                  }
                  className={inputClass(fieldErrors.password)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("auth.confirmPassword")}</span>
                <input
                  required
                  type="password"
                  value={manualForm.confirmPassword}
                  onChange={(event) =>
                    setManualForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
                  }
                  className={inputClass(fieldErrors.confirmPassword)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("profile.editor.fields.gender")}</span>
                <select
                  value={manualForm.gender}
                  onChange={(event) =>
                    setManualForm((previous) => ({
                      ...previous,
                      gender: event.target.value as Gender,
                    }))
                  }
                  className={inputClass(fieldErrors.gender)}
                >
                  <option value={Gender.MALE}>{translateGender(t, Gender.MALE)}</option>
                  <option value={Gender.FEMALE}>{translateGender(t, Gender.FEMALE)}</option>
                  <option value={Gender.OTHER}>{translateGender(t, Gender.OTHER)}</option>
                  <option value={Gender.PREFER_NOT_TO_SAY}>{translateGender(t, Gender.PREFER_NOT_TO_SAY)}</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("profile.editor.fields.trainingLevel")}</span>
                <select
                  value={manualForm.sportLevel}
                  onChange={(event) =>
                    setManualForm((previous) => ({
                      ...previous,
                      sportLevel: event.target.value as TrainingLevel,
                    }))
                  }
                  className={inputClass(fieldErrors.sportLevel)}
                >
                  <option value={TrainingLevel.BEGINNER}>{translateTrainingLevel(t, TrainingLevel.BEGINNER)}</option>
                  <option value={TrainingLevel.INTERMEDIATE}>{translateTrainingLevel(t, TrainingLevel.INTERMEDIATE)}</option>
                  <option value={TrainingLevel.ADVANCED}>{translateTrainingLevel(t, TrainingLevel.ADVANCED)}</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("pages.adminMembers.table.membership")}</span>
                <select
                  value={manualForm.membershipType}
                  onChange={(event) =>
                    setManualForm((previous) => ({
                      ...previous,
                      membershipType: event.target.value as MembershipType,
                    }))
                  }
                  className={inputClass(fieldErrors.membershipType)}
                >
                  <option value={MembershipType.MONTHLY}>{translateMembershipType(t, MembershipType.MONTHLY)}</option>
                  <option value={MembershipType.QUARTERLY}>{translateMembershipType(t, MembershipType.QUARTERLY)}</option>
                  <option value={MembershipType.ANNUAL}>{translateMembershipType(t, MembershipType.ANNUAL)}</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("pages.adminMembers.table.status")}</span>
                <select
                  value={manualForm.status}
                  onChange={(event) =>
                    setManualForm((previous) => ({
                      ...previous,
                      status: event.target.value as AccountStatus,
                    }))
                  }
                  className={inputClass(fieldErrors.status)}
                >
                  <option value={AccountStatus.ACTIVE}>{translateAccountStatus(t, AccountStatus.ACTIVE)}</option>
                  <option value={AccountStatus.PENDING}>{translateAccountStatus(t, AccountStatus.PENDING)}</option>
                  <option value={AccountStatus.BLOCKED}>{translateAccountStatus(t, AccountStatus.BLOCKED)}</option>
                </select>
              </label>
            </div>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("profile.editor.fields.address")}</span>
              <textarea
                required
                rows={2}
                value={manualForm.address}
                onChange={(event) =>
                  setManualForm((previous) => ({ ...previous, address: event.target.value }))
                }
                className={inputClass(fieldErrors.address)}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("profile.editor.fields.emergencyContact")}</span>
              <input
                required
                value={manualForm.emergencyContact}
                onChange={(event) =>
                  setManualForm((previous) => ({
                    ...previous,
                    emergencyContact: event.target.value,
                  }))
                }
                className={inputClass(fieldErrors.emergencyContact)}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-club-text-soft">{t("pages.adminMembers.manual.profileImageUrl")}</span>
              <input
                value={manualForm.profileImage}
                onChange={(event) =>
                  setManualForm((previous) => ({
                    ...previous,
                    profileImage: event.target.value,
                  }))
                }
                className={inputClass(fieldErrors.profileImage)}
                placeholder={t("pages.adminMembers.manual.profileImagePlaceholder")}
              />
            </label>

            <button type="submit" disabled={createLoading} className="cn-btn cn-btn-primary w-full !py-3">
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {createLoading ? t("pages.adminMembers.manual.creating") : t("pages.adminMembers.manual.create")}
            </button>
          </form>
        </Card>
      </section>

      {confirmRejectMember ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-club-surface p-5 shadow-[0_35px_80px_rgba(0,0,0,0.55)]">
            <h3 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">{t("pages.adminMembers.confirmRejectTitle")}</h3>
            <p className="mt-2 text-sm text-club-text-soft">
              {t("pages.adminMembers.confirmRejectText")}
            </p>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="font-semibold text-white">{confirmRejectMember.displayName}</p>
              <p className="text-xs text-club-muted">{confirmRejectMember.email}</p>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRejectMember(null)}
                className="cn-btn cn-btn-ghost !py-2"
              >
                {t("pages.adminMembers.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={() => rejectPendingMember(confirmRejectMember)}
                disabled={actionLoading?.id === confirmRejectMember.id}
                className="cn-btn cn-btn-danger !py-2"
              >
                {actionLoading?.id === confirmRejectMember.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t("pages.adminMembers.actions.confirmReject")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMember ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-club-surface shadow-[0_35px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">{t("pages.adminMembers.detailsTitle")}</h3>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="cn-btn cn-btn-ghost !px-2.5 !py-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar name={selectedMember.displayName} avatarUrl={selectedMember.profileImage} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{selectedMember.displayName}</p>
                  <p className="truncate text-sm text-club-muted">{selectedMember.email}</p>
                </div>
                <Tag label={translateAccountStatus(t, selectedMember.status)} tone={tagToneByStatus(selectedMember.status)} className="ms-auto" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("pages.adminMembers.table.phone")}</p>
                  <p className="mt-1 text-sm text-white">{selectedMember.phone ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("profile.editor.fields.dateOfBirth")}</p>
                  <p className="mt-1 text-sm text-white">
                    {selectedMember.dateOfBirth ? formatRegistrationDate(selectedMember.dateOfBirth, intlLocale) : "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("pages.adminMembers.table.age")}</p>
                  <p className="mt-1 text-sm text-white">
                    {calculateAge(selectedMember.dateOfBirth) ?? "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("profile.editor.fields.gender")}</p>
                  <p className="mt-1 text-sm text-white">{selectedMember.gender ? translateGender(t, selectedMember.gender) : "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("pages.adminMembers.table.level")}</p>
                  <p className="mt-1 text-sm text-white">{selectedMember.sportLevel ? translateTrainingLevel(t, selectedMember.sportLevel) : "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("pages.adminMembers.table.membership")}</p>
                  <p className="mt-1 text-sm text-white">{selectedMember.membershipType ? translateMembershipType(t, selectedMember.membershipType) : "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("profile.editor.fields.address")}</p>
                  <p className="mt-1 text-sm text-white">{selectedMember.address ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-club-muted">{t("profile.editor.fields.emergencyContact")}</p>
                  <p className="mt-1 text-sm text-white">{selectedMember.emergencyContact ?? "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-5 end-5 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.kind === "success"
                ? "cn-rise pointer-events-auto flex items-start gap-2 rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-2.5 text-sm text-emerald-100 shadow-[0_14px_35px_rgba(0,0,0,0.5)]"
                : "cn-rise pointer-events-auto flex items-start gap-2 rounded-xl border border-rose-300/35 bg-rose-500/15 px-3 py-2.5 text-sm text-rose-100 shadow-[0_14px_35px_rgba(0,0,0,0.5)]"
            }
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="sr-only">{t("pages.adminMembers.pendingVisible", { count: pendingVisibleCount })}</div>
    </div>
  );
}
