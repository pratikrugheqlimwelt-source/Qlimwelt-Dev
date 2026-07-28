import { cn } from "@/lib/utils";

type ExternalResourceLinkProps = React.ComponentPropsWithoutRef<"a"> & {
  href: string;
};

/** External link — always opens in a new tab securely */
export function ExternalResourceLink({
  href,
  className,
  children,
  ...props
}: ExternalResourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className)}
      {...props}
    >
      {children}
    </a>
  );
}

export function isExternalUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
