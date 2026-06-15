import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ArenaDialogSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<ArenaDialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

type ArenaDialogContentProps = React.ComponentPropsWithoutRef<typeof DialogContent> & {
  size?: ArenaDialogSize;
};

export function ArenaDialogContent({
  className,
  size = "md",
  children,
  ...props
}: ArenaDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "z-[100] grid max-h-[min(92vh,820px)] w-[calc(100vw-1.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border border-white/15 bg-card/95 p-0 shadow-[0_0_80px_hsl(270_80%_45%/0.18)] sm:rounded-2xl",
        "[&>button]:right-4 [&>button]:top-4 [&>button]:z-20 [&>button]:rounded-lg [&>button]:border [&>button]:border-white/10 [&>button]:bg-background/80 [&>button]:p-1.5 [&>button]:text-foreground/80 [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button]:hover:bg-background [&>button]:hover:text-foreground",
        SIZE_CLASS[size],
        className
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function ArenaDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn(
        "shrink-0 space-y-1.5 border-b border-white/10 bg-gradient-to-br from-neon-purple/10 via-transparent to-neon-cyan/10 px-5 pb-4 pt-5 pr-14 text-left sm:px-6",
        className
      )}
      {...props}
    />
  );
}

export function ArenaDialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-h-0 overflow-x-hidden overflow-y-auto px-5 py-4 sm:px-6", className)}
      {...props}
    />
  );
}

export function ArenaDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn(
        "shrink-0 gap-2 border-t border-white/10 bg-background/40 px-5 py-4 sm:flex-row sm:justify-end sm:space-x-0 sm:px-6",
        className
      )}
      {...props}
    />
  );
}

export {
  DialogDescription as ArenaDialogDescription,
  DialogTitle as ArenaDialogTitle,
};
