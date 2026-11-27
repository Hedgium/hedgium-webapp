import { authFetch } from "@/utils/api";
import type {
  AcceptInviteResult,
  BuilderTab,
  MarketViewOption,
  Paginated,
  TraderInvite,
  TraderProfile,
  TraderStrategyRow,
  TraderSubscription,
} from "@/types/trader";
import type {
  BuilderLeg,
  BuilderLegCreate,
  BuilderLegUpdate,
  StrategyBuilder,
  StrategyBuilderCreate,
  StrategyBuilderUpdate,
  StrategyTemplate,
} from "@/types/builder";
import type { PlaceOrderPayload, ModifyOrderPayload } from "@/services/liveTradingActions";

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data as T;
}

export async function listTraderTemplates(
  marketView: Exclude<MarketViewOption, "CUSTOM"> | ""
): Promise<StrategyTemplate[]> {
  const q = marketView ? `?market_view=${encodeURIComponent(marketView)}` : "";
  const res = await authFetch(`trader/templates/${q}`, { cache: "no-store" });
  return readJson(res);
}

export async function listTraderBuilders(params: {
  tab: BuilderTab;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<StrategyBuilder>> {
  const search = new URLSearchParams();
  search.set("tab", params.tab);
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  if (params.search) search.set("search", params.search);
  const res = await authFetch(`trader/builders/?${search.toString()}`, {
    cache: "no-store",
  });
  return readJson(res);
}

export async function createTraderBuilder(
  payload: StrategyBuilderCreate
): Promise<StrategyBuilder> {
  const res = await authFetch("trader/builders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return readJson(res);
}

export async function updateTraderBuilder(
  id: number,
  payload: StrategyBuilderUpdate
): Promise<StrategyBuilder> {
  const res = await authFetch(`trader/builders/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return readJson(res);
}

export async function deleteTraderBuilder(id: number): Promise<void> {
  const res = await authFetch(`trader/builders/${id}/`, { method: "DELETE" });
  await readJson(res);
}

export async function checkTraderBuilder(id: number): Promise<StrategyBuilder> {
  const res = await authFetch(`trader/builders/${id}/check/`, { method: "POST" });
  return readJson(res);
}

export async function activateTraderBuilder(id: number): Promise<StrategyBuilder> {
  const res = await authFetch(`trader/builders/${id}/activate/`, { method: "POST" });
  return readJson(res);
}

export async function refreshTraderBuilder(id: number): Promise<StrategyBuilder> {
  const res = await authFetch(`trader/builders/${id}/refresh/`, { method: "POST" });
  return readJson(res);
}

export async function createTraderLeg(payload: BuilderLegCreate): Promise<BuilderLeg> {
  const res = await authFetch("trader/legs/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return readJson(res);
}

export async function updateTraderLeg(
  id: number,
  payload: BuilderLegUpdate
): Promise<BuilderLeg> {
  const res = await authFetch(`trader/legs/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return readJson(res);
}

export async function deleteTraderLeg(id: number): Promise<void> {
  const res = await authFetch(`trader/legs/${id}/`, { method: "DELETE" });
  await readJson(res);
}

export async function listTraderStrategies(params?: {
  completed?: boolean;
  page?: number;
  pageSize?: number;
  orderBy?: string;
}): Promise<Paginated<TraderStrategyRow>> {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("page_size", String(params?.pageSize ?? 50));
  if (params?.completed != null) search.set("completed", String(params.completed));
  if (params?.orderBy) search.set("order_by", params.orderBy);
  const res = await authFetch(`trader/strategies/?${search.toString()}`, {
    cache: "no-store",
  });
  return readJson(res);
}

export async function getTraderStrategy(id: number) {
  const res = await authFetch(`trader/strategies/${id}/`, { cache: "no-store" });
  return readJson(res);
}

export async function getTraderStrategyPositions(id: number) {
  const res = await authFetch(`trader/strategies/${id}/positions/`, {
    cache: "no-store",
  });
  return readJson(res);
}

export async function getTraderStrategyTradeCycles(id: number, page = 1) {
  const res = await authFetch(
    `trader/strategies/${id}/trade-cycles/?page=${page}&page_size=20`,
    { cache: "no-store" }
  );
  return readJson(res);
}

export async function getTraderStrategySnapshots(id: number, page = 1) {
  const res = await authFetch(
    `trader/strategies/${id}/metric-snapshots/?page=${page}&page_size=50`,
    { cache: "no-store" }
  );
  return readJson(res);
}

export async function getTraderStrategyAdjustments(id: number, page = 1) {
  const res = await authFetch(
    `trader/strategies/${id}/adjustments/?page=${page}&page_size=10`,
    { cache: "no-store" }
  );
  return readJson(res);
}

export async function listTraderProfiles(): Promise<TraderProfile[]> {
  const res = await authFetch("trader/profiles/", { cache: "no-store" });
  return readJson(res);
}

export async function refreshTraderProfileMargin(
  profileId: number
): Promise<TraderProfile> {
  const res = await authFetch(`trader/profiles/${profileId}/refresh-margin/`, {
    cache: "no-store",
  });
  return readJson(res);
}

export async function getTraderLiveMargin(profileId: number) {
  const res = await authFetch(`trader/profiles/${profileId}/live/margin/`, {
    cache: "no-store",
  });
  return readJson(res);
}

export async function listTraderSubscriptions(): Promise<TraderSubscription[]> {
  const res = await authFetch("trader/subscriptions/", { cache: "no-store" });
  return readJson(res);
}

export async function listTraderInvites(): Promise<TraderInvite[]> {
  const res = await authFetch("trader/invites/", { cache: "no-store" });
  return readJson(res);
}

export async function createTraderInvite(payload?: {
  max_uses?: number;
  expires_at?: string | null;
}): Promise<TraderInvite> {
  const res = await authFetch("trader/invites/", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
  return readJson(res);
}

export async function acceptTraderInvite(code: string): Promise<AcceptInviteResult> {
  const res = await authFetch(`trader/invites/${encodeURIComponent(code)}/accept/`, {
    method: "POST",
  });
  return readJson(res);
}

export async function attachTraderProfiles(
  subscriptionId: number,
  profileIds: number[]
): Promise<TraderSubscription> {
  const res = await authFetch(`trader/subscriptions/${subscriptionId}/profiles/`, {
    method: "POST",
    body: JSON.stringify({ profile_ids: profileIds }),
  });
  return readJson(res);
}

export async function listClientProfilesForAttach(
  clientId: number
): Promise<TraderProfile[]> {
  const res = await authFetch(`trader/clients/${clientId}/profiles/`, {
    cache: "no-store",
  });
  return readJson(res);
}

export async function traderPlaceOrder(
  profileId: number | string,
  payload: PlaceOrderPayload
) {
  const response = await authFetch(
    `trader/profiles/${profileId}/live/orders/place/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  return { ok: response.ok, data };
}

export async function traderPlaceTestOrder(
  profileId: number | string,
  payload: PlaceOrderPayload
) {
  const response = await authFetch(
    `trader/profiles/${profileId}/live/orders/place-test/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  return { ok: response.ok, data };
}

export async function traderModifyOrder(
  profileId: number | string,
  orderId: string,
  payload: ModifyOrderPayload
) {
  const response = await authFetch(
    `trader/profiles/${profileId}/live/orders/modify/${orderId}/`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  return { ok: response.ok, data };
}

export async function traderCancelOrder(profileId: number | string, orderId: string) {
  const response = await authFetch(
    `trader/profiles/${profileId}/live/orders/cancel/${orderId}/`,
    { method: "DELETE" }
  );
  const data = await response.json();
  return { ok: response.ok, data };
}
