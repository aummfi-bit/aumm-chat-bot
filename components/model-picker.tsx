"use client";

import type { ModelsApiPayload } from "@/lib/models-contract";
import {
  MODEL_OPTIONS_UI,
  defaultModel,
  isGatewayPickerSlot,
  type modelID,
} from "@/ai/providers";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

interface ModelPickerProps {
  selectedModel: modelID;
  setSelectedModel: (model: modelID) => void;
}

function optimisticFallback(): ModelsApiPayload["options"] {
  return MODEL_OPTIONS_UI().map(({ id, label }) => {
    if (isGatewayPickerSlot(id)) {
      return {
        id,
        label,
        available: false,
        selectable: false,
        note: "Premium (AI Gateway) — not selectable in this app",
      };
    }
    return {
      id,
      label,
      available: true,
      note: "Provisioning not verified (network error — check env on server)",
    };
  });
}

function subtitleLine(opt: ModelsApiPayload["options"][number]): string {
  if (opt.available && opt.selectable !== false) {
    return opt.note ?? "Ready — credential check passed.";
  }
  if (opt.selectable === false && opt.note) {
    return opt.note;
  }
  return `Unavailable — ${opt.requirement ?? "needs server configuration"}`;
}

/** Single-line label for trigger + list (avoids multi-line Radix SelectValue). */
function modelOptionOneLine(opt: ModelsApiPayload["options"][number]): string {
  const short = shortStatusForModel(opt);
  return `${opt.label} · ${short}`;
}

function shortStatusForModel(opt: ModelsApiPayload["options"][number]): string {
  if (opt.selectable === false) {
    return "AI Gateway (off)";
  }
  if (opt.note === "Checking server credential status…") {
    return "Checking…";
  }
  if (opt.note === "Provisioning not verified (network error — check env on server)") {
    return "Env not verified";
  }
  if (opt.available) {
    if (
      opt.note?.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
      opt.note?.includes("Google Generative AI")
    ) {
      return "Google · key set";
    }
    if (opt.note === "Groq" || opt.note?.startsWith("Groq")) {
      return "Groq";
    }
    if (opt.note?.includes("OpenRouter")) {
      return "OpenRouter · key set";
    }
    return "Ready";
  }
  if (opt.requirement === "GROQ_API_KEY") {
    return "needs GROQ_API_KEY";
  }
  if (opt.requirement === "GOOGLE_GENERATIVE_AI_API_KEY") {
    return "needs GOOGLE_GENERATIVE_AI_API_KEY";
  }
  if (opt.requirement === "OPENROUTER_API_KEY") {
    return "needs OPENROUTER_API_KEY";
  }
  return opt.requirement ?? "Unavailable";
}

export const ModelPicker = ({
  selectedModel,
  setSelectedModel,
}: ModelPickerProps) => {
  const [loadedOptions, setLoadedOptions] = useState<
    ModelsApiPayload["options"] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<ModelsApiPayload>;
      })
      .then((data) => {
        if (cancelled || !Array.isArray(data.options) || data.options.length === 0)
          return;
        setLoadedOptions(data.options);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedOptions(optimisticFallback());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadingScan = MODEL_OPTIONS_UI().map(({ id, label }) => {
    if (isGatewayPickerSlot(id)) {
      return {
        id,
        label,
        available: false,
        selectable: false as const,
        note: "Premium (AI Gateway) — not selectable in this app",
      };
    }
    return {
      id,
      label,
      available: true as const,
      note: "Checking server credential status…",
    };
  });

  /** Before first network result: scan UI. After fetch: server truth / optimistic fallback rows. */
  const displayChoices = loadedOptions ?? loadingScan;

  const firstSelectableId = useMemo((): modelID => {
    const hit = displayChoices.find(
      (c) => c.available && c.selectable !== false,
    );
    return (hit?.id ?? defaultModel) as modelID;
  }, [displayChoices]);

  const selectedResolvable = displayChoices.some(
    (c) =>
      c.id === selectedModel &&
      c.available === true &&
      c.selectable !== false,
  );

  useEffect(() => {
    if (selectedResolvable) return;
    if (selectedModel !== firstSelectableId) setSelectedModel(firstSelectableId);
  }, [selectedResolvable, selectedModel, firstSelectableId, setSelectedModel]);

  const controlledValue = selectedResolvable ? selectedModel : firstSelectableId;

  return (
    <div className="absolute bottom-2 left-2 flex flex-col gap-2 max-w-[min(100vw-2rem,460px)] min-w-0">
      <Select
        value={controlledValue}
        onValueChange={(v) => setSelectedModel(v as modelID)}
      >
        <SelectTrigger className="min-w-[14rem] max-w-[min(100vw-3rem,32rem)] h-9 min-h-[2.25rem] py-0 text-left [&_[data-slot=select-value]]:min-w-0">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="min-w-[min(100vw-2rem,460px)] max-h-[70vh]">
          <SelectGroup>
            {displayChoices.map((choice) => {
              const line = modelOptionOneLine(choice);
              const pendingScan =
                choice.note === "Checking server credential status…";
              const locked = choice.selectable === false;
              const missingKey =
                !locked && !choice.available && !pendingScan;
              const disabled =
                choice.selectable === false ||
                (!pendingScan && choice.available !== true);

              return (
                <SelectItem
                  key={choice.id}
                  value={choice.id}
                  disabled={disabled}
                  textValue={`${choice.label} ${subtitleLine(choice)}`}
                  className={cn(
                    "min-w-0 items-center py-2",
                    locked && "data-[disabled]:opacity-60",
                  )}
                >
                  <SelectItemText asChild>
                    <span
                      className={cn(
                        "block w-full min-w-0 truncate text-left text-sm leading-tight",
                        missingKey && "text-amber-700 dark:text-amber-400",
                        locked && "text-muted-foreground",
                      )}
                    >
                      {line}
                    </span>
                  </SelectItemText>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
