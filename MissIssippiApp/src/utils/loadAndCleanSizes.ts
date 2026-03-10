import { InventoryService } from "../service/InventoryService";
import type { iSize } from "./DataInterfaces";

export const loadAndCleanSizes = async (): Promise<iSize[]> => {
  const sizesRaw = await InventoryService.getSizes();
  const cleaned = sizesRaw.map((size) => ({
    ...size,
    sizeName: (size.sizeName ?? "").trim(),
  }));
  return cleaned.sort((a, b) => {
    const seqDiff = (a.sizeSequence ?? 0) - (b.sizeSequence ?? 0);
    if (seqDiff !== 0) return seqDiff;
    return a.sizeName.localeCompare(b.sizeName);
  });
};
