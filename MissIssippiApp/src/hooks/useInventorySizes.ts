import { useEffect, useState } from "react";
import { InventoryService } from "../service/InventoryService";
import type { iSize } from "../utils/DataInterfaces";

type UseInventorySizesResult = {
  sizeColumns: iSize[];
  sizeLoading: boolean;
  sizeError: string | null;
};

export const useInventorySizes = (): UseInventorySizesResult => {
  const [sizeColumns, setSizeColumns] = useState<iSize[]>([]);
  const [sizeLoading, setSizeLoading] = useState(true);
  const [sizeError, setSizeError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    InventoryService.getSizes()
      .then((data) => {
        if (!isMounted) return;
        const ordered = [...data].sort((a, b) => (a.sizeSequence ?? 0) - (b.sizeSequence ?? 0));
        const cleanSizes = ordered.map((size) => ({
          ...size,
          sizeName: (size.sizeName ?? "").trim(),
        }));
        setSizeColumns(cleanSizes);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error(err);
        const message = err instanceof Error ? err.message : "Failed to load sizes.";
        setSizeError(message);
      })
      .finally(() => {
        if (!isMounted) return;
        setSizeLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { sizeColumns, sizeLoading, sizeError };
};
