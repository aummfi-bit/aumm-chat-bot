import Image from "next/image";
import Link from "next/link";
import { ClaudeSkillCTA } from "./claude-skill-cta";
import { ThemeToggle } from "./theme-toggle";

export const Header = () => {
  return (
    <div className="fixed right-0 left-0 w-full top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
      <div className="flex justify-between items-center gap-3 p-4 flex-wrap">
        <div className="flex flex-row items-center gap-2 shrink-0 min-w-0">
          <Link
            href="https://aumm.fi/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-row items-center gap-2.5 min-w-0 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        </div>
        <div className="flex flex-row items-center gap-3 shrink-0 ml-auto">
          <ClaudeSkillCTA />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};
