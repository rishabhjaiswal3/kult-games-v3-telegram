import { Hexagon } from "lucide-react";

type MetricProps = {
  label: string;
  value: string;
  icon?: boolean;
};

export function Metric({ label, value, icon = false }: MetricProps) {
  return (
    <div className="border-white/8 px-5 py-4 sm:border-r last:border-r-0">
      <div className="font-tech text-[9px] uppercase text-white/42">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-xl font-semibold">
        {icon && <Hexagon className="h-5 w-5 text-[#9b33ff]" />} {value}
      </div>
    </div>
  );
}
