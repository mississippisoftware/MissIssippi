import { fetchJson } from "./apiClient";
import type {
  InventoryHistoryBatchDetail,
  InventoryHistoryBatchSummary,
  InventoryHistorySource,
} from "../utils/inventoryHistoryTypes";

type InventoryHistoryBatchQuery = {
  batchId?: string;
  source?: InventoryHistorySource | "all";
  from?: string;
  to?: string;
  take?: number;
};

const API = {
  getBatches: "/inventory-history/batches",
  getBatchDetails: (batchId: string) => `/inventory-history/batches/${batchId}`,
};

export const InventoryHistoryService = {
  async getBatches(params: InventoryHistoryBatchQuery): Promise<InventoryHistoryBatchSummary[]> {
    const search = new URLSearchParams();

    if (params.batchId) {
      search.set("batchId", params.batchId);
    }

    if (params.source && params.source !== "all") {
      search.set("source", params.source);
    }

    if (params.from) {
      search.set("from", params.from);
    }

    if (params.to) {
      search.set("to", params.to);
    }

    if (params.take) {
      search.set("take", String(params.take));
    }

    const query = search.toString();
    const path = query ? `${API.getBatches}?${query}` : API.getBatches;
    return fetchJson<InventoryHistoryBatchSummary[]>(path);
  },

  async getBatchDetails(batchId: string): Promise<InventoryHistoryBatchDetail> {
    return fetchJson<InventoryHistoryBatchDetail>(API.getBatchDetails(batchId));
  },
};

export default InventoryHistoryService;
