import Link, { type LinkProps } from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type AppLinkProps = LinkProps &
  Pick<ComponentPropsWithoutRef<"a">, "className" | "role" | "aria-label" | "onClick"> & {
    children: ReactNode;
  };

export function AppLink({ prefetch = false, ...props }: AppLinkProps) {
  return <Link prefetch={prefetch} {...props} />;
}
