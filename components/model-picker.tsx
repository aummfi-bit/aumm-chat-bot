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
    <div className="absolute bottom-2 left-2 flex flex-col gap-2 max-w-[min(100vw-2rem,460px)]">
      <Select
        value={controlledValue}
        onValueChange={(v) => setSelectedModel(v as modelID)}
      >
        <SelectTrigger className="min-w-[14rem] max-w-[min(100vw-3rem,32rem)] h-auto py-2 text-left whitespace-normal [&_[data-slot=select-value]]:whitespace-normal">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="min-w-[min(100vw-2rem,460px)] max-h-[70vh]">
          <SelectGroup>
            {displayChoices.map((choice) => {
              const sub = subtitleLine(choice);
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
                  textValue={`${choice.label} ${sub}`}
                  className={cn(locked && "data-[disabled]:opacity-60")}
                >
                  <div className="flex flex-col gap-0.5 py-1 pr-6 max-w-[min(100vw-4rem,28rem)]">
                    <span
                      className={cn(
                        "text-sm leading-snug whitespace-normal",
                        locked && "text-muted-foreground",
                      )}
                    >
                      {choice.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs leading-snug whitespace-normal",
                        locked
                          ? "text-muted-foreground/90"
                          : missingKey
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {sub}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
