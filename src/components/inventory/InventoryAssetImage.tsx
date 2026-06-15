import { cn } from "@/lib/utils";

type InventoryAssetImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Tighter padding for compact cards */
  compact?: boolean;
};

/** Asset on a transparent stage — screen blend helps white-backed PNGs/JPEGs float on dark UI. */
export function InventoryAssetImage({
  src,
  alt,
  className,
  imgClassName,
  compact = false,
}: InventoryAssetImageProps) {
  return (
    <div
      className={cn(
        "inventory-asset-stage relative flex items-center justify-center overflow-hidden bg-transparent",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(154,53,255,0.14),transparent_68%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04),transparent_70%)]"
        aria-hidden
      />

      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "inventory-asset-img relative z-[1] object-contain object-center transition duration-500 group-hover:scale-[1.05]",
            compact ? "max-h-[88%] max-w-[88%] p-1" : "max-h-[90%] max-w-[90%] p-2",
            imgClassName
          )}
        />
      ) : (
        <span className="relative z-[1] font-tech text-[8px] uppercase tracking-wider text-white/28">No image</span>
      )}
    </div>
  );
}
