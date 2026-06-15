import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

type ArenaPageLayoutProps = {
  children: ReactNode;
  /** Default caps content at 1284px; pass `w-full max-w-none` to use full main column width. */
  contentClassName?: string;
};

/** Pixel-perfect arena pages: dashboard topbar + max-width content (shared Kult sidebar via AppShell). */
export function ArenaPageLayout({ children, contentClassName }: ArenaPageLayoutProps) {
  return (
    <>
      <DashboardTopbar />
      <section
        className={cn(
          "mx-auto w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8",
          contentClassName ?? "max-w-full"
        )}
      >
        {children}
      </section>
    </>
  );
}
