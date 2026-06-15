import { useEffect } from "react";
import { MOMENTS_IFRAME_URL } from "@/lib/momentsUrl";

export function MomentsPage() {
  useEffect(() => {
    window.location.href = `${MOMENTS_IFRAME_URL}/moments`;
  }, []);

  return null;
}

export default MomentsPage;
