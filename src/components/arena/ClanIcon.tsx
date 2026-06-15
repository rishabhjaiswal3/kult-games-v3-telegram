import zeroGLogo from "@/assets/0G Logo.png";

function SolanaIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M64.6 237.9c-2.4-2.4-5.7-3.8-9.1-3.8H3.8c-3.1 0-4.6 3.8-2.4 6l63 63c2.4 2.4 5.7 3.8 9.1 3.8h51.7c3.1 0 4.6-3.8 2.4-6l-63-63z"
        fill="currentColor"
      />
      <path
        d="M332.4 73.1c2.4 2.4 5.7 3.8 9.1 3.8h51.7c3.1 0 4.6-3.8 2.4-6l-63-63c-2.4-2.4-5.7-3.8-9.1-3.8H331.8c-3.1 0-4.6 3.8-2.4 6l63 63z"
        fill="currentColor"
      />
      <path
        d="M271.6 155.5c2.4 2.4 5.7 3.8 9.1 3.8h51.7c3.1 0 4.6-3.8 2.4-6l-63-63c-2.4-2.4-5.7-3.8-9.1-3.8H210.8c-3.1 0-4.6 3.8-2.4 6l63 63z"
        fill="currentColor"
      />
    </svg>
  );
}

function BaseIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZeroGClanIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <img src={zeroGLogo} alt="0G" className={`${className} object-contain`} />;
}

export function ClanIcon({ type, className = "h-3.5 w-3.5" }: { type: string; className?: string }) {
  if (type === "solana") return <SolanaIcon className={`${className} text-teal-400`} />;
  if (type === "base") return <BaseIcon className={`${className} text-blue-500`} />;
  if (type === "zerog") return <ZeroGClanIcon className={className} />;
  return null;
}
