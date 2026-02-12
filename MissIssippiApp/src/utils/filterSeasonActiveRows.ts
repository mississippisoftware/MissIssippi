export type SeasonActiveRow = {
  seasonId?: number | null;
  inProduction?: boolean;
};

export const filterSeasonActiveRows = <T extends SeasonActiveRow>(
  rows: T[],
  {
    seasonFilterId,
    activeFilter,
  }: {
    seasonFilterId?: string;
    activeFilter?: string;
  }
): T[] => {
  let next = rows;
  if (seasonFilterId) {
    const seasonId = Number(seasonFilterId);
    if (seasonId) {
      next = next.filter((row) => row.seasonId === seasonId);
    }
  }
  if (activeFilter === "active") {
    next = next.filter((row) => row.inProduction);
  } else if (activeFilter === "inactive") {
    next = next.filter((row) => !row.inProduction);
  }
  return next;
};
