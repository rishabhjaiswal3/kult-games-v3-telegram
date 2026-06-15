import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { saveTrackedAiArenaBattleId } from "@/lib/arenaBattleStorage";

type ArenaLiveMatchContextValue = {
  activeBattleId: string | null;
  setActiveBattleId: (id: string | null) => void;
};

const ArenaLiveMatchContext = createContext<ArenaLiveMatchContextValue | null>(null);

export function ArenaLiveMatchProvider({ children }: { children: ReactNode }) {
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      activeBattleId,
      setActiveBattleId: (id: string | null) => {
        setActiveBattleId(id);
        saveTrackedAiArenaBattleId(id);
      },
    }),
    [activeBattleId]
  );
  return <ArenaLiveMatchContext.Provider value={value}>{children}</ArenaLiveMatchContext.Provider>;
}

export function useArenaLiveMatch() {
  const ctx = useContext(ArenaLiveMatchContext);
  if (!ctx) {
    return { activeBattleId: null, setActiveBattleId: () => undefined };
  }
  return ctx;
}
