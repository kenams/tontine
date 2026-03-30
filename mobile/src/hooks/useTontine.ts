import { useMemo } from "react";

import { useTontineStore } from "../store/tontineStore";

/**
 * Hook utilitaire pour le tableau de bord des tontines.
 */
export function useTontine() {
  const tontines = useTontineStore((state) => state.tontines);
  const currentTontine = useTontineStore((state) => state.currentTontine);
  const isLoading = useTontineStore((state) => state.isLoading);
  const fetchMyTontines = useTontineStore((state) => state.fetchMyTontines);
  const fetchTontineById = useTontineStore((state) => state.fetchTontineById);

  const activeTontines = useMemo(() => tontines.filter((tontine) => tontine.status === "active"), [tontines]);
  const totalMembers = useMemo(
    () => tontines.reduce((sum, tontine) => sum + tontine.membersCount, 0),
    [tontines]
  );

  async function refreshTontines() {
    return fetchMyTontines();
  }

  async function selectTontine(id: string) {
    return fetchTontineById(id);
  }

  return {
    tontines,
    currentTontine,
    isLoading,
    refreshTontines,
    selectTontine,
    activeTontines,
    totalMembers
  };
}

