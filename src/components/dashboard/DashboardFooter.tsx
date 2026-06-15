import zeroGLogo from "@/assets/0G Logo.png";

export function DashboardFooter() {
  return (
    <footer className="border-t border-white/7 px-4 py-4 text-xs text-white/42 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-full items-center justify-between">
        <span>© 2026 AI Arena. All rights reserved.</span>
        <span className="flex items-center gap-3">
          Powered by <img src={zeroGLogo} alt="0G" className="h-5 w-auto" />
        </span>
      </div>
    </footer>
  );
}
