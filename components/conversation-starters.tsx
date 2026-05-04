"use client";

import { Button } from "@/components/ui/button";

export const CONVERSATION_STARTERS = [
  "What is the Aureum protocol?",
  "What is Sagix Miliarium Aureum, and how does it relate Watts–Strogatz / small-world network topology to dual-anchor liquidity design and routing (aggregators / arbitrage) in DeFi?",
  "According to Sagix's liquidity-risk layer framework, what are the four layers used to assess DeFi liquidity risk?",
  "What is the difference between CCC and CCB?",
  "What is der Bodensee Pool and how does that affect the $AuMM price and the overall incentive APY?",
  "Liquidity provision in DeFi is widely seen as high-risk for low return — what makes LPing on aumm.fi different?",
  "How does the CCB mechanism play an anti-cyclical and anti-FOMO dampening role?",
] as const;

type ConversationStartersProps = {
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function ConversationStarters({
  onSelect,
  disabled,
}: ConversationStartersProps) {
  return (
    <div className="mb-4 w-full text-left border border-border/60 rounded-xl bg-secondary/40 px-4 py-4 sm:px-5">
      <p className="mb-3 text-base font-bold text-foreground">
        Try these conversation starters:
      </p>
      <ul className="flex flex-col gap-2">
        {CONVERSATION_STARTERS.map((line) => (
          <li key={line}>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => onSelect(line)}
              className="h-auto w-full justify-start whitespace-normal rounded-lg px-3 py-2.5 text-left text-base font-bold text-foreground hover:bg-background/80 hover:text-foreground border border-transparent hover:border-border/80 disabled:opacity-60"
            >
              <span className="mr-2 shrink-0">–</span>
              <span>{line}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
