import Image from "next/image";
import NextLink from "next/link";

export const ProjectOverview = () => {
  return (
    <div className="flex flex-col items-center justify-end">
      <Image
        src="/images/enter_banner.png"
        alt="Project Aureum — illustration"
        width={1600}
        height={600}
        priority
        className="w-full rounded-lg border border-border object-cover shadow-lg mb-6 max-h-[min(38vh,280px)] sm:max-h-[min(42vh,320px)]"
      />
      <h1 className="text-3xl font-semibold mb-4 text-foreground tracking-wide">
        Aureum chat
      </h1>
      <p className="text-center text-muted-foreground">
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
