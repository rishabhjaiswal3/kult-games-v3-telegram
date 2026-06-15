import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Check, Gift, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { equipVehicle, getGarageState } from "@/api/highwayHustleApi";
import { InventoryAssetImage } from "@/components/inventory/InventoryAssetImage";
import { carIndexFromId } from "@/constants/highwayHustleCars";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type HighwayHustleGarageProps = {
  className?: string;
  /** Tighter grid on game detail page */
  compact?: boolean;
  /** Minimal horizontal strip for the play-mode modal */
  modal?: boolean;
  title?: string;
};

export function HighwayHustleGarage({
  className,
  compact = false,
  modal = false,
  title = "Your garage",
}: HighwayHustleGarageProps) {
  const { walletAddress, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const garageQuery = useQuery({
    queryKey: ["highway-hustle", "garage", walletAddress],
    queryFn: () => getGarageState(walletAddress!),
    enabled: isAuthenticated && !!walletAddress,
    staleTime: 30_000,
  });

  const equipMutation = useMutation({
    mutationFn: async (carId: string) => {
      const index = carIndexFromId(carId);
      if (index === undefined) throw new Error("This vehicle cannot be equipped yet.");
      await equipVehicle(walletAddress!, index);
      return carId;
    },
    onSuccess: (carId) => {
      void queryClient.invalidateQueries({ queryKey: ["highway-hustle", "garage", walletAddress] });
      toast.success(`${carId.toUpperCase()} equipped — ready for your next run.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to equip vehicle");
    },
  });

  const panelClass = cn(
    "arena-panel border-white/8 bg-[#04080f]/95",
    modal ? "p-3" : "p-4 sm:p-5",
    className,
  );

  if (!isAuthenticated) {
    return (
      <div className={panelClass}>
        <GarageHeader title={title} modal={modal} />
        <p className={cn("text-white/55", modal ? "mt-2 text-[11px]" : "mt-3 text-sm")}>
          Sign in with your wallet to view purchased vehicles and rewards.
        </p>
      </div>
    );
  }

  if (garageQuery.isLoading) {
    return (
      <div className={panelClass}>
        <GarageHeader title={title} modal={modal} />
        <div className={cn("flex items-center gap-2 text-white/50", modal ? "mt-2 text-xs" : "mt-4 text-sm")}>
          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
          Loading your garage…
        </div>
      </div>
    );
  }

  if (garageQuery.isError) {
    return (
      <div className={panelClass}>
        <GarageHeader title={title} modal={modal} />
        <p className={cn("text-red-300/80", modal ? "mt-2 text-[11px]" : "mt-3 text-sm")}>
          Could not load garage
          {garageQuery.error instanceof Error ? `: ${garageQuery.error.message}` : "."}
        </p>
      </div>
    );
  }

  const cars = garageQuery.data?.cars ?? [];
  const rewardCount = garageQuery.data?.rewardIds.length ?? 0;

  const equippedCar = cars.find((car) => car.isEquipped);

  return (
    <div className={panelClass}>
      <GarageHeader
        title={title}
        modal={modal}
        subtitle={
          modal
            ? equippedCar
              ? `Equipped: ${equippedCar.name}`
              : "Tap a vehicle to equip"
            : cars.length > 0
              ? `${cars.length} vehicle${cars.length === 1 ? "" : "s"}${rewardCount ? ` · ${rewardCount} reward${rewardCount === 1 ? "" : "s"}` : ""}`
              : "No vehicles yet"
        }
      />

      {cars.length === 0 ? (
        <p className={cn("text-white/55", modal ? "mt-2 text-[11px]" : "mt-3 text-sm")}>
          You start with the free Coupe and Pickup. Purchase more in Inventory or earn rewards from sister games.
        </p>
      ) : modal ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {cars.map((car) => (
            <GarageCarCard
              key={car.id}
              car={car}
              modal
              isEquipping={equipMutation.isPending && equipMutation.variables === car.id}
              disabled={car.isEquipped || equipMutation.isPending}
              onEquip={() => equipMutation.mutate(car.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "mt-4 grid gap-3",
            compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {cars.map((car) => (
            <GarageCarCard
              key={car.id}
              car={car}
              isEquipping={equipMutation.isPending && equipMutation.variables === car.id}
              disabled={car.isEquipped || equipMutation.isPending}
              onEquip={() => equipMutation.mutate(car.id)}
            />
          ))}
        </div>
      )}

      {!modal ? (
        <p className="mt-4 font-tech text-[9px] uppercase tracking-[0.2em] text-white/35">
          Equipped vehicle syncs to Highway Hustle when you launch a mission.
        </p>
      ) : null}
    </div>
  );
}

type GarageCarCardProps = {
  car: {
    id: string;
    name: string;
    imageUrl?: string;
    isReward?: boolean;
    isEquipped?: boolean;
  };
  modal?: boolean;
  isEquipping: boolean;
  disabled: boolean;
  onEquip: () => void;
};

function GarageCarCard({ car, modal = false, isEquipping, disabled, onEquip }: GarageCarCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onEquip}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-lg border text-left transition",
        modal ? "w-[5.5rem] p-1.5" : "rounded-xl p-3",
        car.isEquipped
          ? "border-emerald-500/45 bg-emerald-950/20 shadow-[0_0_24px_rgba(0,240,128,0.08)]"
          : "border-white/10 bg-[#0a0f1b]/70 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(154,53,255,0.12)]",
        disabled && !isEquipping && !car.isEquipped && "opacity-60",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-md bg-black/30",
          modal ? "mb-1.5 h-14" : "mb-3 h-24 rounded-lg",
        )}
      >
        <InventoryAssetImage src={car.imageUrl} alt={car.name} compact className="h-full w-full" />
        {car.isReward ? (
          <span
            className={cn(
              "absolute left-1 top-1 inline-flex items-center rounded border border-amber-500/35 bg-amber-950/70 font-tech font-bold uppercase tracking-wider text-amber-300",
              modal ? "px-1 py-0.5 text-[7px]" : "left-2 top-2 gap-1 px-1.5 py-0.5 text-[8px]",
            )}
          >
            {modal ? "★" : (
              <>
                <Gift className="h-3 w-3" />
                Reward
              </>
            )}
          </span>
        ) : null}
        {car.isEquipped ? (
          <span
            className={cn(
              "absolute right-1 top-1 inline-flex items-center rounded border border-emerald-500/35 bg-emerald-950/70 font-tech font-bold uppercase tracking-wider text-emerald-300",
              modal ? "px-1 py-0.5 text-[7px]" : "right-2 top-2 gap-1 px-1.5 py-0.5 text-[8px]",
            )}
          >
            {modal ? <Check className="h-2.5 w-2.5" /> : (
              <>
                <Check className="h-3 w-3" />
                Equipped
              </>
            )}
          </span>
        ) : null}
      </div>

      {modal ? (
        <p className="truncate text-center font-tech text-[8px] font-bold uppercase tracking-wide text-white">
          {car.name}
        </p>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-tech text-sm font-bold uppercase tracking-wide text-white">{car.name}</p>
            <p className="mt-0.5 font-tech text-[9px] uppercase tracking-wider text-white/40">
              {car.isEquipped ? "Active in game" : "Tap to equip"}
            </p>
          </div>
          {isEquipping ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-purple-400" />
          ) : (
            <Sparkles
              className={cn(
                "h-4 w-4 shrink-0 transition",
                car.isEquipped ? "text-emerald-400" : "text-white/25 group-hover:text-purple-300",
              )}
            />
          )}
        </div>
      )}
    </button>
  );
}

function GarageHeader({
  title,
  subtitle,
  modal = false,
}: {
  title: string;
  subtitle?: string;
  modal?: boolean;
}) {
  return (
    <div className={cn("flex items-center", modal ? "gap-2" : "gap-3")}>
      <div
        className={cn(
          "grid place-items-center rounded-lg border border-cyan-500/25 bg-cyan-500/10",
          modal ? "h-7 w-7" : "h-10 w-10",
        )}
      >
        <Car className={cn("text-cyan-300", modal ? "h-3.5 w-3.5" : "h-5 w-5")} />
      </div>
      <div className="min-w-0">
        <h3 className={cn("font-tech font-semibold uppercase tracking-wider text-white/86", modal ? "text-[10px]" : "text-xs")}>
          {title}
        </h3>
        {subtitle ? <p className="truncate text-[10px] text-white/45">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default HighwayHustleGarage;
