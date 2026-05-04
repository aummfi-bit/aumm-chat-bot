"use client";

import { motion } from "motion/react";
import { Button } from "./ui/button";
import { memo } from "react";

interface SuggestedPromptsProps {
  sendMessage: (input: string) => void;
}

function PureSuggestedPrompts({ sendMessage }: SuggestedPromptsProps) {
  const suggestedActions = [
    {
      title: "How does AuMM issuance work?",
      label: "Is it like Bitcoin mining?",
      action:
        "How does AuMM issuance work, and how is it different from Bitcoin mining?",
    },
    {
      title: "What is der Bodensee?",
      label: "Composition and role in the protocol",
      action:
        "What is der Bodensee Pool: its token composition and role in Project Aureum?",
    },
    {
      title: "Swap fee bands",
      label: "Miliarium vs Bodensee defaults",
      action:
        "What are the immutable swap fee bands and genesis defaults for Miliarium pools vs der Bodensee?",
    },
    {
      title: "Gauge vs composition challenge",
      label: "Miliarium pools governance",
      action:
        "Can Miliarium Aureum pools be gauge-challenged? How do structural changes work?",
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              sendMessage(suggestedAction.action);
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedPrompts = memo(PureSuggestedPrompts, () => true);
