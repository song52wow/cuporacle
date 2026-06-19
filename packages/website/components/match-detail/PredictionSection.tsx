"use client";

import type { Match, PredictionResponse, ModelResult } from "@/lib/types";
import { PredictionHero } from "./PredictionHero";

interface Props {
  match: Match;
  prediction: {
    primary: PredictionResponse | null;
    models: ModelResult[];
  } | null;
}

export function PredictionSection({ match, prediction }: Props) {
  return (
    <PredictionHero
      match={match}
      prediction={prediction?.primary ?? null}
    />
  );
}
