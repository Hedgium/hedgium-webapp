import { authFetch } from "@/utils/api";
import type {
  Engine1AssetClass,
  Engine1Execute,
  Engine1Grid,
  Engine1GridCell,
  Engine1Instrument,
  Engine1InstrumentDraft,
  Engine1Preview,
  Engine1PreviewPayload,
  Engine1ExecutePayload,
} from "@/types/engine1";

async function readError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { detail?: string };
  return (typeof data.detail === "string" && data.detail.trim()) || fallback;
}

export async function fetchEngine1Grid(): Promise<Engine1Grid> {
  const res = await authFetch("engine1/grid/");
  if (!res.ok) throw new Error(await readError(res, "Failed to load allocation grid"));
  return res.json() as Promise<Engine1Grid>;
}

export async function saveEngine1Grid(
  cells: Pick<Engine1GridCell, "risk" | "holding_period" | "asset_class_id" | "percent">[]
): Promise<Engine1Grid> {
  const res = await authFetch("engine1/grid/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cells }),
  });
  if (!res.ok) throw new Error(await readError(res, "Failed to save allocation grid"));
  return res.json() as Promise<Engine1Grid>;
}

export async function createEngine1AssetClass(name: string): Promise<Engine1AssetClass> {
  const res = await authFetch("engine1/asset-classes/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await readError(res, "Failed to add asset class"));
  return res.json() as Promise<Engine1AssetClass>;
}

export async function deleteEngine1AssetClass(id: number): Promise<void> {
  const res = await authFetch(`engine1/asset-classes/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readError(res, "Failed to delete asset class"));
}

export async function fetchEngine1Instruments(
  assetClassId?: number
): Promise<Engine1Instrument[]> {
  const qs = assetClassId != null ? `?asset_class_id=${assetClassId}` : "";
  const res = await authFetch(`engine1/instruments/${qs}`);
  if (!res.ok) throw new Error(await readError(res, "Failed to load instruments"));
  return res.json() as Promise<Engine1Instrument[]>;
}

export async function saveEngine1ClassInstruments(
  assetClassId: number,
  instruments: Engine1InstrumentDraft[]
): Promise<Engine1Instrument[]> {
  const res = await authFetch(`engine1/asset-classes/${assetClassId}/instruments/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruments }),
  });
  if (!res.ok) throw new Error(await readError(res, "Failed to save instruments"));
  return res.json() as Promise<Engine1Instrument[]>;
}

export async function previewEngine1(
  profileId: string | number,
  payload: Engine1PreviewPayload
): Promise<Engine1Preview> {
  const res = await authFetch(`engine1/preview/${profileId}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "Failed to preview Engine 1 orders"));
  return res.json() as Promise<Engine1Preview>;
}

export async function executeEngine1(
  profileId: string | number,
  payload: Engine1ExecutePayload
): Promise<Engine1Execute> {
  const res = await authFetch(`engine1/execute/${profileId}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "Failed to execute Engine 1 orders"));
  return res.json() as Promise<Engine1Execute>;
}
