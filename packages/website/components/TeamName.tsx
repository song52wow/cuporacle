"use client";

import { useLocale } from "next-intl";
import { getTeamName } from "@/lib/teams";
import type { Locale } from "@/i18n/routing";

interface TeamNameProps {
  name: string;
  className?: string;
}

export function TeamName({ name, className }: TeamNameProps) {
  const locale = useLocale() as Locale;
  return <span className={className}>{getTeamName(name, locale)}</span>;
}
