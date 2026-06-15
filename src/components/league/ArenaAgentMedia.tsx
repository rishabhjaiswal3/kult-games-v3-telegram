import { cn } from "@/lib/utils";

type ArenaAgentMediaProps = {
  src: string;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
};

export function ArenaAgentMedia({ src, alt, className, fit = "cover" }: ArenaAgentMediaProps) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  if (src.endsWith(".mp4")) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={cn("h-full w-full", fitClass, className)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full", fitClass, className)}
      loading="lazy"
      decoding="async"
    />
  );
}
