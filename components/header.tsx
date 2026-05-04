import Image from "next/image";
import Link from "next/link";
import { ClaudeSkillCTA } from "./claude-skill-cta";
import { ThemeToggle } from "./theme-toggle";

export const Header = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-[1100] border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-nowrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-1 flex-row items-center gap-2 sm:gap-4">
          <Link
            href="https://aumm.fi/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 shrink-0 flex-row items-center gap-2.5 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Image
              src="/images/aureum.jpeg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded border border-border object-cover bg-card"
              priority
            />
            <span className="font-sans text-xl tracking-[3px] text-primary whitespace-nowrap">
              AUREUM
            </span>
          </Link>
          <Link
            href="https://www.aumm.fi/"
            target="_blank"
            rel="noopener noreferrer"
            title="VISIT https://www.aumm.fi for more info"
            className="min-w-0 truncate text-xs text-muted-foreground transition-colors hover:text-primary sm:text-sm"
          >
            VISIT https://www.aumm.fi for more info
          </Link>
        </div>
        <div className="ml-2 flex shrink-0 flex-row items-center gap-2 sm:ml-4 sm:gap-3">
          <ClaudeSkillCTA />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
