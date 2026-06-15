import { useCallback, useEffect, useRef } from "react";
import { MOMENTS_IFRAME_URL } from "@/lib/momentsUrl";
import { useAuth } from "@/contexts/AuthContext";
import { TOKEN_KEY, WALLET_KEY } from "@/constants/storageKeys";

const IFRAME_SRC = `${MOMENTS_IFRAME_URL}/moments?embed=1`;

export function MomentsPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { player } = useAuth();

  const sendAuthToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const token = localStorage.getItem(TOKEN_KEY);
    const walletAddress = localStorage.getItem(WALLET_KEY);

    iframe.contentWindow.postMessage(
      {
        type: "KULT_AUTH",
        payload: token
          ? { token, player: { walletAddress, name: player?.name ?? null } }
          : null,
      },
      MOMENTS_IFRAME_URL,
    );
  }, [player]);

  useEffect(() => {
    sendAuthToIframe();
  }, [sendAuthToIframe]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col">
      <iframe
        ref={iframeRef}
        src={IFRAME_SRC}
        onLoad={sendAuthToIframe}
        title="Kult Moments"
        className="h-full w-full border-0"
        allow="clipboard-write; autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

export default MomentsPage;
