import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MOMENTS_IFRAME_URL } from "@/lib/momentsUrl";

export function MomentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="min-h-full bg-transparent text-foreground">
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/moments")}
            className="mb-8 flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-wider text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Moments
          </button>
          <div className="arena-panel flex flex-col items-center gap-3 border-white/8 bg-[#04080f]/80 p-16 text-center">
            <p className="text-sm font-semibold text-white/60">Moment not found</p>
            <button
              type="button"
              onClick={() => navigate("/moments")}
              className="mt-4 rounded border border-purple-500/25 px-4 py-2 font-tech text-[10px] font-bold uppercase text-purple-400 transition hover:bg-purple-500/10"
            >
              Browse Moments
            </button>
          </div>
        </section>
      </div>
    );
  }

  const iframeSrc = `${MOMENTS_IFRAME_URL}/moments/${id}`;

  return (
    <div className="flex min-h-full flex-col bg-transparent text-foreground">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/moments")}
          className="flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-wider text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Moments
        </button>
      </div>

      {/* Embed the full kult-moment SPA for this moment */}
      <iframe
        src={iframeSrc}
        title="Kult Moment"
        className="w-full flex-1 border-0"
        style={{ minHeight: "calc(100vh - 80px)" }}
        allow="clipboard-write; autoplay; fullscreen"
        loading="lazy"
      />
    </div>
  );
}

export default MomentDetailPage;
