"use client";

import { useState } from "react";
import type { Match, PredictionResponse, ModelResult } from "@/lib/types";
import { PredictionHero } from "./PredictionHero";
import { ModelComparison } from "./ModelComparison";

interface Props {
  match: Match;
  prediction: {
    primary: PredictionResponse | null;
    models: ModelResult[];
  } | null;
}

export function PredictionSection({ match, prediction }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(
    prediction?.primary?.llm_provider
  );

  const activeModel = prediction?.models.find(
    (m) => m.provider === selectedProvider && m.status === "ok"
  );

  return (
    <>
      <PredictionHero
        match={match}
        prediction={prediction?.primary ?? null}
        activeModel={activeModel}
      />
      {prediction && prediction.models.length > 0 && (
        <div className="mt-6">
          <ModelComparison
            models={prediction.models}
            selectedProvider={selectedProvider}
            onSelect={setSelectedProvider}
          />
        </div>
      )}
    </>
  );
}
