import type { iInventoryCell, iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";

function normalizeApiBase() {
  const raw = (import.meta.env.VITE_API_BASE ?? "/api").trim();

  // If someone sets VITE_API_BASE to "api" instead of "/api", make it absolute so
  // the dev server doesn't serve index.html and break JSON parsing.
  if (!/^https?:\/\//i.test(raw) && !raw.startsWith("/")) {
    return `/${raw}`.replace(/\/$/, "");
  }

  return raw.replace(/\/$/, "");
}

const API_BASE = normalizeApiBase();

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const body = await response.text();
    throw new Error(
      `Unexpected response type for ${url} (${contentType || "unknown"}): ${body.slice(0, 200)}`
    );
  }

  try {
    return (await response.json()) as T;
  } catch (err) {
    const body = await response.text();
    throw new Error(`Failed to parse JSON from ${url}: ${(err as Error).message}. Body: ${body.slice(0, 200)}`);
  }
}

export type InventorySearchFilters = {
  styleNumber?: string;
  description?: string;
  colorName?: string;
  sizeName?: string;
  seasonName?: string;
};

function normalizeSizes(rawSizes: Record<string, iInventoryCell | undefined> | undefined) {
  const source = rawSizes ?? {};
  return Object.keys(source).reduce<Record<string, iInventoryCell>>((acc, key) => {
    const cell = source[key];
    if (!cell) return acc;

    acc[key.trim()] = {
      qty: Number(cell.qty ?? 0),
      inventoryId: cell.inventoryId ?? cell.inventoryId,
      sizeId: cell.sizeId ?? cell.sizeId,
    };

    return acc;
  }, {});
}

function buildQuery(filters?: InventorySearchFilters) {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.styleNumber) params.set("StyleNumber", filters.styleNumber);
  if (filters.description) params.set("Description", filters.description);
  if (filters.colorName) params.set("ColorName", filters.colorName);
  if (filters.sizeName) params.set("SizeName", filters.sizeName);
  if (filters.seasonName) params.set("SeasonName", filters.seasonName);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function mapPivotRows(data: any[]): iInventoryDisplayRow[] {
  return data.map((row) => {
    const sizes = normalizeSizes(row.sizes ?? row.Sizes);

    return {
      id: `${row.styleColorId ?? row.StyleColorId}-${row.colorName ?? row.ColorName}`,
      styleNumber: row.styleNumber ?? row.StyleNumber ?? "",
      colorName: row.colorName ?? row.ColorName ?? "",
      styleId: row.styleId ?? row.StyleId,
      colorId: row.colorId ?? row.ColorId,
      styleColorId: row.styleColorId ?? row.StyleColorId,
      seasonName: row.seasonName ?? row.SeasonName,
      description: row.description ?? row.Description,
      sizes,
    } as iInventoryDisplayRow;
  });
}

export const inventoryService = {
  async getSizes(): Promise<iSize[]> {
    return fetchJson<iSize[]>("/Sizes/GetSizes");
  },

  async getPivotInventory(filters?: InventorySearchFilters): Promise<iInventoryDisplayRow[]> {
    const query = buildQuery(filters);
    const data = await fetchJson<any[]>(`/ViewInventory/GetInventory${query}`);
    return mapPivotRows(data);
  },

  async searchPivotInventory(filters?: InventorySearchFilters): Promise<iInventoryDisplayRow[]> {
    const query = buildQuery(filters);
    const data = await fetchJson<any[]>(`/EditInventory/SearchInventory${query}`);
    return mapPivotRows(data);
  },

  async savePivotInventory(rows: iInventoryDisplayRow[]): Promise<void> {
    const payload = rows.map((row) => ({
      styleNumber: row.styleNumber,
      colorName: row.colorName,
      styleId: Number(row.styleId ?? 0),
      colorId: Number(row.colorId ?? 0),
      styleColorId: Number(row.styleColorId ?? 0),
      seasonName: row.seasonName,
      sizes: Object.entries(row.sizes ?? {}).reduce<Record<string, iInventoryCell>>(
        (acc, [sizeName, cell]) => {
          if (!cell) return acc;

          acc[sizeName] = {
            qty: Number(cell.qty ?? 0),
            inventoryId: cell.inventoryId ? Number(cell.inventoryId) : undefined,
            sizeId: cell.sizeId ? Number(cell.sizeId) : 0,
          };

          return acc;
        },
        {}
      ),
    }));

    const res = await fetch(`${API_BASE}/EditInventory/SaveInventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Save failed (${res.status}): ${res.statusText}`);
    }
  },
};
