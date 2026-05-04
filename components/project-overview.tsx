import Image from "next/image";
import NextLink from "next/link";

export const ProjectOverview = () => {
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto rounded-2xl border border-border bg-card/40 p-5 sm:p-8 shadow-md">
      <Image
        src="/images/enter_banner.png"
        alt="Project Aureum — illustration"
        width={1600}
        height={600}
        priority
        className="w-full rounded-xl border border-border/80 object-cover shadow-lg mb-5 sm:mb-6 max-h-[min(52vh,420px)] sm:max-h-[min(58vh,520px)]"
      />
      <h1 className="text-3xl sm:text-4xl font-semibold mb-3 text-foreground tracking-wide">
        Aureum chat
      </h1>
      <p className="text-center text-muted-foreground text-base sm:text-lg leading-snug max-w-xl">
        Welcome to the Aureum Protocol chat bot.
        <br />
        Please refer to the Aureum Protocol{" "}
        <Link href="https://aumm.fi">aumm.fi</Link> website for more details.
      </p>
    </div>
  );
};

const Link = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <NextLink
      target="_blank"
      className="text-primary hover:underline underline-offset-2 transition-colors duration-75"
      href={href}
    >
      {children}
    </NextLink>
  );
};
