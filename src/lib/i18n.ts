import type {
  AccountStatus,
  CommunityPostType,
  Gender,
  MembershipType,
  Role,
  TrainingLevel,
  TrainingType,
} from "@prisma/client";

import enMessages from "@/messages/en.json";

export const locales = ["en", "fr", "ar"] as const;

export type Locale = (typeof locales)[number];
export type Direction = "ltr" | "rtl";

export const defaultLocale: Locale = "en";
export const localeCookieName = "cn-locale";
export const localeStorageKey = "cn-locale";

export const intlLocaleMap: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-MA",
};

export type Messages = typeof enMessages;
export type Dictionary = Messages;
export type TranslationValues = Record<string, string | number>;

type MessageLeaf = string | number | boolean | null;

export type MessageKey = LeafPaths<Messages>;
export type Translate = (key: MessageKey, values?: TranslationValues) => string;

type LeafPaths<T> = T extends MessageLeaf
  ? never
  : {
      [K in keyof T & string]: T[K] extends MessageLeaf
        ? K
        : T[K] extends Array<unknown>
          ? never
          : `${K}.${LeafPaths<T[K]>}`;
    }[keyof T & string];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) {
    return defaultLocale;
  }

  return isLocale(value) ? value : defaultLocale;
}

export function getDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getIntlLocale(locale: Locale) {
  return intlLocaleMap[locale];
}

function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getMessageValue(messages: Messages, key: MessageKey): string {
  const value = key
    .split(".")
    .reduce<unknown>((current, part) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }

      return (current as Record<string, unknown>)[part];
    }, messages);

  return typeof value === "string" ? value : key;
}

function interpolate(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, token) => {
    const value = values[token];
    return value === undefined ? match : String(value);
  });
}

export function createTranslator(messages: Messages): Translate {
  return (key, values) => interpolate(getMessageValue(messages, key), values);
}

export function translateRole(t: Translate, role: Role) {
  if (role === "ADMIN") return t("roles.admin");
  if (role === "COACH") return t("roles.coach");
  return t("roles.member");
}

export function translateAccountStatus(
  t: Translate,
  status: AccountStatus | string | null | undefined,
) {
  if (!status) {
    return "";
  }

  if (status === "PENDING") return t("enums.accountStatus.pending");
  if (status === "ACTIVE") return t("enums.accountStatus.active");
  if (status === "BLOCKED") return t("enums.accountStatus.blocked");
  return humanizeEnum(status);
}

export function translateGender(
  t: Translate,
  gender: Gender | string | null | undefined,
) {
  if (!gender) {
    return "";
  }

  if (gender === "MALE") return t("enums.gender.male");
  if (gender === "FEMALE") return t("enums.gender.female");
  if (gender === "OTHER") return t("enums.gender.other");
  if (gender === "PREFER_NOT_TO_SAY") {
    return t("enums.gender.preferNotToSay");
  }

  return humanizeEnum(gender);
}

export function translateTrainingLevel(
  t: Translate,
  level: TrainingLevel | string | null | undefined,
) {
  if (!level) {
    return "";
  }

  if (level === "BEGINNER") return t("enums.trainingLevel.beginner");
  if (level === "INTERMEDIATE") return t("enums.trainingLevel.intermediate");
  if (level === "ADVANCED") return t("enums.trainingLevel.advanced");
  return humanizeEnum(level);
}

export function translateTrainingType(
  t: Translate,
  type: TrainingType | string | null | undefined,
) {
  if (!type) {
    return "";
  }

  if (type === "CARDIO") return t("enums.trainingType.cardio");
  if (type === "TECHNIQUE") return t("enums.trainingType.technique");
  if (type === "SPARRING") return t("enums.trainingType.sparring");
  if (type === "CONDITIONING") return t("enums.trainingType.conditioning");
  return humanizeEnum(type);
}

export function translateMembershipType(
  t: Translate,
  type: MembershipType | string | null | undefined,
) {
  if (!type) {
    return "";
  }

  if (type === "MONTHLY") return t("enums.membershipType.monthly");
  if (type === "QUARTERLY") return t("enums.membershipType.quarterly");
  if (type === "ANNUAL") return t("enums.membershipType.annual");
  return humanizeEnum(type);
}

export function translateCommunityPostType(
  t: Translate,
  type: CommunityPostType | string | null | undefined,
) {
  if (!type) {
    return "";
  }

  if (type === "PHOTO") return t("activityFeed.community.postTypes.photo");
  if (type === "ACHIEVEMENT") {
    return t("activityFeed.community.postTypes.achievement");
  }
  if (type === "SUPPORT") return t("activityFeed.community.postTypes.support");
  if (type === "TEXT") return t("activityFeed.community.postTypes.text");
  return humanizeEnum(type);
}
