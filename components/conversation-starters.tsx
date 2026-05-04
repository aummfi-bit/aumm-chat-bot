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
  "How does Reserve Protocol (reserve.org) stand to benefit from Aureum's dual-anchor liquidity design, with Sagix Club Edelweiss's ixEDEL DTF serving as a major cross-pool routing anchor (alongside svZCHF)?",
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
    <div className="mb-4 w-full text-left border border-border/60 rounded-xl bg-secondary/40 px-4 py-3 sm:px-5 sm:py-3.5">
      <p className="mb-2 text-sm font-semibold text-foreground">
        Try these conversation starters:
      </p>
      <ul className="flex flex-col gap-0 sm:gap-0.5">
        {CONVERSATION_STARTERS.map((line) => (
          <li key={line}>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => onSelect(line)}
              className="h-auto min-h-0 w-full justify-start whitespace-normal rounded-md px-2.5 py-1 text-left text-sm font-medium leading-snug text-foreground hover:bg-background/80 hover:text-foreground border border-transparent hover:border-border/80 disabled:opacity-60"
            >
              <span className="mr-1.5 shrink-0 self-start pt-0.5">–</span>
              <span className="leading-snug">{line}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
