import aiBot from "@/assets/aiBot2.png";
import { cn } from "@/lib/utils";

type KultAiBotAvatarProps = {
  className?: string;
  /** When empty, decorative use next to visible “KULT AI” text */
  alt?: string;
};

export function KultAiBotAvatar({ className, alt = "KULT AI" }: KultAiBotAvatarProps) {
  return <img src={aiBot} alt={alt} className={cn("object-contain", className)} />;
}
