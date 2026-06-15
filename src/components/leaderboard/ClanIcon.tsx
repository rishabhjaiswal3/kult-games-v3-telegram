import zeroGLogo from "@/assets/0G Logo.png";
import kultLogo from "@/assets/Kult Logo.png";

export function ClanIcon({ type, className = "h-3.5 w-3.5" }: { type: string; className?: string }) {
  if (type === "zerog") {
    return <img src={zeroGLogo} alt="" className={`${className} object-contain`} />;
  }
  if (type === "kult") {
    return <img src={kultLogo} alt="" className={`${className} object-contain`} />;
  }
  if (type === "solana") {
    return (
      <svg className={`${className} text-teal-400`} viewBox="0 0 397 311" fill="currentColor">
        <path d="M64.6 237.9c-2.4-2.4-5.7-3.8-9.1-3.8H3.8c-3.1 0-4.6 3.8-2.4 6l63 63c2.4 2.4 5.7 3.8 9.1 3.8h51.7c3.1 0 4.6-3.8 2.4-6l-63-63z" />
      </svg>
    );
  }
  if (type === "base") {
    return (
      <span className={`${className} inline-flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold`}>
        B
      </span>
    );
  }
  if (type === "rebel") {
    return (
      <span className={`${className} inline-flex items-center justify-center rounded-full bg-amber-400/20 text-amber-400 text-[9px] font-bold`}>
        R
      </span>
    );
  }
  if (type === "shadow") {
    return (
      <span className={`${className} inline-flex items-center justify-center rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold`}>
        S
      </span>
    );
  }
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-full bg-[#9a35ff]/20 text-[#b95cff] text-[9px] font-bold`}>
      K
    </span>
  );
}

export function clanFromArchetype(archetype: string) {
  const map: Record<string, { name: string; type: string }> = {
    BERSERKER: { name: "Base", type: "base" },
    TACTICIAN: { name: "Solana", type: "solana" },
    DEFENDER: { name: "Base", type: "base" },
    ASSASSIN: { name: "ZeroG", type: "zerog" },
    SUPPORT: { name: "Solana", type: "solana" },
    HYBRID: { name: "ZeroG", type: "zerog" },
  };
  return map[archetype] ?? { name: "ZeroG", type: "zerog" };
}
