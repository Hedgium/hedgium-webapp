"use client";

import { useState, lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { authFetch } from "@/utils/api";
import { formatMoneyIN } from "@/utils/formatNumber";
import useAlert from "@/hooks/useAlert";
import { RotateCw, Eye, Plus, X, LayoutList, Zap, GitCompare, ExternalLink } from "lucide-react";
import Link from "next/link";

// Lazy load the modal component
const TradeCycleDetailsModal = lazy(
  () => import("./TradeCycleDetailsModal")
) as LazyExoticComponent<
  ComponentType<{
    tradeCycleId: number;
    tradeCycle?: { id: number; profile_id?: number } | null;
    onClose: () => void;
  }>
>;

const ProfileLiveModal = lazy(
  () => import("./ProfileLiveModal")
) as LazyExoticComponent<
  ComponentType<{
    profileId: number | string;
    onClose: () => void;
  }>
>;

type TradeCycleProfile = {
  id: number;
  broker_name?: string | null;
  risk_profile?: string | null;
  margin_equity?: number | null;
  quantity_multiplier?: number | null;
};

type TradeCycleClient = {
  username: string;
};

type TradeCycle = {
  id: number;
  client: TradeCycleClient;
  profile: TradeCycleProfile;
  state: string;
  locked_reason?: string | null;
  is_master?: boolean | null;
  no_of_orders?: number | null;
  no_of_positions?: number | null;
  total_pnl?: number | null;
};

type CompareResult = {
  matched_count: number;
  missing_in_trade_cycle: number;
  extra_in_trade_cycle: number;
  buy_quantity_mismatches: number;
  sell_quantity_mismatches: number;
  missing_instruments?: string[];
  extra_instruments?: string[];
  missing_details?: {
    instrument: string;  // Master format (used for placing orders)
    exchange?: string | null;
    master_buy_quantity: number;
    master_sell_quantity: number;
  }[];
  extra_details?: {
    instrument: string;  // User's format
    master_instrument?: string;  // Master format for reference
    exchange?: string | null;
    trade_cycle_buy_quantity: number;
    trade_cycle_sell_quantity: number;
  }[];
  quantity_mismatch_details?: {
    instrument: string;  // Master format (used for placing orders)
    user_instrument?: string;  // User's format for display
    exchange?: string | null;
    master_buy_quantity: number;
    trade_cycle_buy_quantity: number;
    master_sell_quantity: number;
    trade_cycle_sell_quantity: number;
  }[];
};

type SearchProfile = {
  id: number;
  user: { email: string };
  broker_name?: string | null;
  margin_equity?: number | null;
};

type TradeCyclesProps = {
  id: number;
  trade_cycles: TradeCycle[];
  fetchTradeCycles: () => Promise<void> | void;
  multiplierAllowed?: boolean;
};

export default function TradeCycles({
  id,
  trade_cycles,
  fetchTradeCycles,
  multiplierAllowed = false,
}: TradeCyclesProps) {
  const [selectedCycles, setSelectedCycles] = useState<number[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<SearchProfile[]>([]); // 🔥 NEW → search results list
  const [refreshing, setRefreshing] = useState(false);
  const [validatingCycleId, setValidatingCycleId] = useState<number | null>(null);
  const [updatingMaster, setUpdatingMaster] = useState<number | null>(null);
  const [updatingState, setUpdatingState] = useState<number | null>(null);
  const [comparingCycleId, setComparingCycleId] = useState<number | null>(null);
  const [compareResults, setCompareResults] = useState<Record<number, CompareResult>>({});
  const [compareErrors, setCompareErrors] = useState<Record<number, string>>({});
  const [compareStepMessage, setCompareStepMessage] = useState<string | null>(null);
  const [compareModalCycleId, setCompareModalCycleId] = useState<number | null>(null);
  const [comparingAll, setComparingAll] = useState(false);
  const [compareAllStatus, setCompareAllStatus] = useState<Record<number, "running" | "action_required" | "no_action" | "error">>({});
  const [placingCompareOrder, setPlacingCompareOrder] = useState<string | null>(null);
  const [placingMatchAllCycleId, setPlacingMatchAllCycleId] = useState<number | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showAddCyclesModal, setShowAddCyclesModal] = useState(false);
  const [selectedTradeCycleId, setSelectedTradeCycleId] = useState<number | null>(null);
  const [selectedTradeCycle, setSelectedTradeCycle] = useState<{ id: number; profile_id?: number } | null>(null);
  const [liveModalProfileId, setLiveModalProfileId] = useState<number | null>(null);

  const alert = useAlert();
  // Toggle existing cycle selection
  function toggleCycle(cycleId: number) {
    setSelectedCycles((prev) =>
      prev.includes(cycleId)
        ? prev.filter((id) => id !== cycleId)
        : [...prev, cycleId]
    );
  }

  // Toggle profile selection
  function toggleProfile(profileId: number) {
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  }

  // 🔥 Fetch profiles (DON’T TOUCH existing trade_cycles)
  async function searchTradeCycles() {
    if (!search.trim()) return;

    try {
      const res = await authFetch(
        `profiles/?search=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setProfiles(data.results); // Only store profiles separately
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  // Refresh trade cycles
  async function handleRefresh() {
    setRefreshing(true);
    await fetchTradeCycles();
    setRefreshing(false);
  }

  // Delete selected cycles
  async function deleteTradeCycles() {
    if (selectedCycles.length === 0) {
      alert("Select at least one cycle");
      return;
    }

    try {
      alert.info("Deleting!", { duration: 3000 });

      await authFetch(
        `myadmin/delete-trade-cycles/${id}/${selectedCycles.join(",")}/`,
        { method: "DELETE" }
      );
      alert.success("Deleted successfully!", { duration: 3000 });
      fetchTradeCycles();
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  // Create trade cycles from profiles
  async function addTradeCycles() {
    if (selectedProfiles.length === 0) {
      alert("Select at least one profile");
      return;
    }

    try {
      alert.info("Creating trade cycles...", { duration: 3000 });
      const res = await authFetch(`myadmin/create-trade-cycles/${id}/${selectedProfiles.join(",")}/`);

      const data = await res.json();
      console.log("Created cycles:", data);
      fetchTradeCycles();
      setProfiles([]);
      setSelectedProfiles([]);
      setShowAddCyclesModal(false);

      alert.success("Trade cycles created!", { duration: 3000 });
    } catch (error) {
      console.error("Create error:", error);
    }
  }

  function closeAddCyclesModal() {
    setShowAddCyclesModal(false);
    setProfiles([]);
    setSelectedProfiles([]);
  }

  // Open modal for trade cycle details
  function handleShowMore(cycle: TradeCycle) {
    setSelectedTradeCycle({
      id: cycle.id,
      profile_id: cycle.profile?.id,
    });
    setSelectedTradeCycleId(cycle.id);
    setShowModal(true);
  }

  // Close modal
  function handleCloseModal() {
    setShowModal(false);
    setSelectedTradeCycleId(null);
  }

  function handleCloseLiveModal() {
    setLiveModalProfileId(null);
  }

  // Validate and activate trade cycle
  async function handleValidateAndActivate(cycleId: number) {
    if (validatingCycleId) return; // Prevent multiple clicks
    
    setValidatingCycleId(cycleId);
    try {
      alert.info("Validating and activating trade cycle...", { duration: 3000 });
      
      const res = await authFetch(`myadmin/validate-and-activate-trade-cycle/${cycleId}/`, {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === "success") {
        alert.success("Validation task started! Check status shortly.", { duration: 3000 });
        // Refresh after a short delay
        setTimeout(() => {
          fetchTradeCycles();
        }, 2000);
      } else {
        alert.error(data.error || "Failed to trigger validation", { duration: 3000 });
      }
    } catch (error: unknown) {
      console.error("Validation error:", error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : "Failed to trigger validation";
      alert.error(errorMsg, { duration: 3000 });
    } finally {
      setValidatingCycleId(null);
    }
  }

  // Toggle master trade cycle
  async function handleToggleMaster(cycleId: number, currentValue: boolean) {
    if (updatingMaster === cycleId) return; // Prevent multiple clicks
    
    setUpdatingMaster(cycleId);
    try {
      const res = await authFetch(`trade-cycles/${cycleId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_master: !currentValue }),
      });

      if (res.ok) {
        alert.success(
          !currentValue 
            ? "Trade cycle set as master" 
            : "Trade cycle unset as master",
          { duration: 3000 }
        );
        fetchTradeCycles();
      } else {
        const data = await res.json();
        alert.error(data.detail || "Failed to update master status", { duration: 3000 });
      }
    } catch (error: unknown) {
      console.error("Toggle master error:", error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : "Failed to update master status";
      alert.error(errorMsg, { duration: 3000 });
    } finally {
      setUpdatingMaster(null);
    }
  }

  const TRADE_CYCLE_STATES = ["NEW","ACTIVATED", "ADJUSTED", "CLOSED", "INACTIVE"] as const;

  async function handleUpdateState(cycleId: number, newState: string) {
    if (updatingState === cycleId) return;
    setUpdatingState(cycleId);
    try {
      
      const res = await authFetch(`trade-cycles/${cycleId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: newState, trade_allowed: true }),
      });

      if (res.ok) {
        alert.success("State updated", { duration: 2000 });
        fetchTradeCycles();
      } else {
        const data = await res.json();
        alert.error(data.detail || "Failed to update state", { duration: 3000 });
      }
    } catch (error: unknown) {
      console.error("Update state error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to update state";
      alert.error(errorMsg, { duration: 3000 });
    } finally {
      setUpdatingState(null);
    }
  }

  // Poll until refresh task completes (like TradeCycleDetailsModal)
  async function refreshProfilePositionsAndWait(profileId: number): Promise<void> {
    const res = await authFetch(`positions/pnl/refresh/trades/async/${profileId}/`, {
      method: "POST",
    });
    const startData = await res.json();
    if (!res.ok) {
      throw new Error(startData.detail || "Failed to start refresh");
    }
    const taskId = startData.task_id as string | undefined;
    if (!taskId) {
      throw new Error("Refresh task not started");
    }
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await authFetch(`tasks/status/${taskId}/`);
      const statusData = await statusRes.json();
      if (!statusRes.ok) {
        throw new Error(statusData.detail || "Failed to check refresh status");
      }
      if (statusData.status === "SUCCESS") {
        return;
      }
      if (statusData.status === "FAILURE") {
        throw new Error(statusData.result || "Refresh failed");
      }
    }
    throw new Error("Refresh timed out");
  }

  function hasActionRequired(result: CompareResult): boolean {
    return (
      result.missing_in_trade_cycle > 0 ||
      result.extra_in_trade_cycle > 0 ||
      result.buy_quantity_mismatches > 0 ||
      result.sell_quantity_mismatches > 0
    );
  }

  /** Runs the full compare flow for one cycle. Returns the result or null on failure.
   *  Does NOT open the modal or touch comparingCycleId/compareStepMessage. */
  async function runSingleCompare(cycleId: number): Promise<CompareResult | null> {
    const cycle = trade_cycles.find((c) => c.id === cycleId);
    if (!cycle?.profile?.id) return null;
    try {
      const infoRes = await authFetch(`trade-cycles/${cycleId}/master-info/`);
      const info = await infoRes.json();
      if (!infoRes.ok) return null;
      const { master_profile_id, trade_cycle_profile_id } = info as {
        master_profile_id: number;
        trade_cycle_profile_id: number;
      };
      await refreshProfilePositionsAndWait(master_profile_id);
      await refreshProfilePositionsAndWait(trade_cycle_profile_id);
      const res = await authFetch(`trade-cycles/${cycleId}/match-master-positions/`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setCompareResults((prev) => ({ ...prev, [cycleId]: data }));
        return data as CompareResult;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function handleCompareAll() {
    const nonMasterCycles = trade_cycles.filter(
      (c) => !c.is_master
    );
    if (nonMasterCycles.length === 0) {
      alert.error("No active non-master cycles to compare");
      return;
    }
    setComparingAll(true);
    // Mark all as running
    setCompareAllStatus(
      Object.fromEntries(nonMasterCycles.map((c) => [c.id, "running"]))
    );
    for (const cycle of nonMasterCycles) {
      const result = await runSingleCompare(cycle.id);
      setCompareAllStatus((prev) => ({
        ...prev,
        [cycle.id]: result === null
          ? "error"
          : hasActionRequired(result)
          ? "action_required"
          : "no_action",
      }));
    }
    setComparingAll(false);
  }

  async function handleCompareMaster(cycleId: number) {
    if (comparingCycleId === cycleId) return;
    const cycle = trade_cycles.find((c) => c.id === cycleId);
    if (!cycle?.profile?.id) {
      alert.error("Trade cycle or profile not found");
      return;
    }
    setComparingCycleId(cycleId);
    setCompareStepMessage("Comparing with master…");
    setCompareErrors((prev) => { const next = { ...prev }; delete next[cycleId]; return next; });
    setCompletedOrders(new Set());
    try {
      const result = await runSingleCompare(cycleId);
      if (result) {
        setCompareModalCycleId(cycleId);
        alert.success("Comparison completed", { duration: 2000 });
      } else {
        const message = "Failed to compare with master";
        setCompareErrors((prev) => ({ ...prev, [cycleId]: message }));
        alert.error(message, { duration: 3000 });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to compare with master";
      setCompareErrors((prev) => ({ ...prev, [cycleId]: errorMsg }));
      alert.error(errorMsg, { duration: 3000 });
    } finally {
      setComparingCycleId(null);
      setCompareStepMessage(null);
    }
  }

  async function handlePlaceCompareOrder(
    cycle: TradeCycle,
    instrument: string,
    transactionType: "BUY" | "SELL",
    quantity: number,
    exchange?: string | null
  ) {
    if (quantity <= 0) {
      alert.error("Quantity must be greater than 0");
      return;
    }

    // Use exchange from position, fallback to NFO for derivatives (contains digits), else NSE
    const resolvedExchange = exchange || (instrument.match(/\d/) ? "NFO" : "NSE");
    
    const requestKey = `${cycle.id}-${instrument}-${transactionType}`;
    setPlacingCompareOrder(requestKey);
    try {
      const payload = {
        instrument,
        exchange: resolvedExchange,
        transaction_type: transactionType,
        quantity,
      };

      // Use the new match order API that handles broker conversion and LIMIT orders
      const res = await authFetch(`trade-cycles/${cycle.id}/place-match-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === "success") {
        const orderInfo = data.data;
        alert.success(
          `Order placed: ${orderInfo.action} ${orderInfo.quantity} ${orderInfo.instrument} @ ${formatMoneyIN(orderInfo.price)}`
        );
        // Mark this order as completed to disable the button
        setCompletedOrders((prev) => new Set(prev).add(requestKey));
      } else {
        alert.error(data.message || "Failed to place order");
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to place order";
      alert.error(errorMsg);
    } finally {
      setPlacingCompareOrder(null);
    }
  }

  /** Build list of match-order items from compare result (missing + quantity mismatches) for batch API */
  function getMatchAllItems(cycleId: number): { instrument: string; exchange: string; transaction_type: "BUY" | "SELL"; quantity: number }[] {
    const result = compareResults[cycleId];
    if (!result) return [];
    const items: { instrument: string; exchange: string; transaction_type: "BUY" | "SELL"; quantity: number }[] = [];
    const resolvedEx = (instrument: string, exchange?: string | null) =>
      exchange || (instrument.match(/\d/) ? "NFO" : "NSE");

    const cycle = trade_cycles.find((c) => c.id === cycleId);
    const quantityMultiplier = cycle?.profile?.quantity_multiplier ?? 1;
    const effectiveMultiplier = multiplierAllowed ? quantityMultiplier : 1;

    if (result.missing_details) {
      for (const item of result.missing_details) {
        const masterNetBase =
          (item.master_buy_quantity ?? 0) - (item.master_sell_quantity ?? 0);
        const targetNetActual = masterNetBase * effectiveMultiplier;
        const currentNetActual = 0; // missing in trade cycle
        const diffActual = targetNetActual - currentNetActual;
        if (diffActual === 0) continue;

        const baseQty = Math.abs(diffActual) / (effectiveMultiplier || 1);
        if (baseQty <= 0) continue;

        const transaction_type: "BUY" | "SELL" =
          diffActual > 0 ? "BUY" : "SELL";

        items.push({
          instrument: item.instrument,
          exchange: resolvedEx(item.instrument, item.exchange),
          transaction_type,
          quantity: Math.round(baseQty),
        });
      }
    }
    if (result.quantity_mismatch_details) {
      for (const item of result.quantity_mismatch_details) {
        const masterNetBase =
          (item.master_buy_quantity ?? 0) - (item.master_sell_quantity ?? 0);
        const tcNetActual =
          (item.trade_cycle_buy_quantity ?? 0) -
          (item.trade_cycle_sell_quantity ?? 0);
        const targetNetActual = masterNetBase * effectiveMultiplier;
        const diffActual = targetNetActual - tcNetActual;
        if (diffActual === 0) continue;

        const baseQty = Math.abs(diffActual) / (effectiveMultiplier || 1);
        if (baseQty <= 0) continue;

        const ex = resolvedEx(item.instrument, item.exchange);
        const transaction_type: "BUY" | "SELL" =
          diffActual > 0 ? "BUY" : "SELL";

        items.push({
          instrument: item.instrument,
          exchange: ex,
          transaction_type,
          quantity: Math.round(baseQty),
        });
      }
    }
    if (result.extra_details) {
      for (const item of result.extra_details) {
        const netActual =
          (item.trade_cycle_buy_quantity ?? 0) -
          (item.trade_cycle_sell_quantity ?? 0);
        if (netActual === 0) continue;

        const diffActual = 0 - netActual; // target is 0
        const baseQty = Math.abs(diffActual) / (effectiveMultiplier || 1);
        if (baseQty <= 0) continue;

        const ex = resolvedEx(item.instrument, item.exchange);
        const instrumentForOrder = item.master_instrument ?? item.instrument;
        const transaction_type: "BUY" | "SELL" =
          diffActual > 0 ? "BUY" : "SELL";

        items.push({
          instrument: instrumentForOrder,
          exchange: ex,
          transaction_type,
          quantity: Math.round(baseQty),
        });
      }
    }
    return items;
  }

  async function handlePlaceMatchAll(cycle: TradeCycle) {
    const items = getMatchAllItems(cycle.id);
    if (items.length === 0) {
      alert.error("No orders to place for Match All");
      return;
    }
    setPlacingMatchAllCycleId(cycle.id);
    try {
      const res = await authFetch(`trade-cycles/${cycle.id}/place-match-orders-batch/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();

      if (data.status === "success") {
        const { orders_created, batches } = data.data || {};
        alert.success(
          `Match All: ${orders_created} order(s) created in ${batches} batch(es)`,
          { duration: 4000 }
        );
        setCompareModalCycleId(null);
        setCompareResults((prev) => ({ ...prev, [cycle.id]: { ...prev[cycle.id], matched_count: (prev[cycle.id]?.matched_count ?? 0) + (orders_created || 0) } }));
        fetchTradeCycles();
      } else {
        alert.error(data.message || "Match All failed");
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Match All failed";
      alert.error(errorMsg);
    } finally {
      setPlacingMatchAllCycleId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-semibold">Trade Cycles ({trade_cycles.length})</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCyclesModal(true)}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <Plus size={16} />
            Add trade cycles
          </button>
          <button
            onClick={handleCompareAll}
            disabled={comparingAll}
            className="btn btn-outline btn-sm"
            title="Compare all non-master active cycles with master"
          >
            {comparingAll ? (
              <><span className="loading loading-spinner loading-xs"></span> Comparing All…</>
            ) : (
              "Compare All"
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`btn btn-ghost btn-sm ${refreshing ? "animate-spin" : ""}`}
            title="Refresh Trade Cycles"
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>

      {/* Add Trade Cycles Modal */}
      {showAddCyclesModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add trade cycles</h3>
              <button
                onClick={closeAddCyclesModal}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-base-content/60 mb-4">
              Search for profiles and add them as trade cycles for this strategy.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search by email..."
                className="input input-bordered input-sm flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTradeCycles()}
              />
              <button className="btn btn-primary btn-sm" onClick={searchTradeCycles}>
                Search
              </button>
            </div>
            {profiles.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-xl border border-base-300 mb-4 max-h-64 overflow-y-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th className="w-10">Select</th>
                        <th>Email</th>
                        <th>Broker</th>
                        <th>Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={selectedProfiles.includes(p.id)}
                              onChange={() => toggleProfile(p.id)}
                            />
                          </td>
                          <td>{p.user.email}</td>
                          <td>{p.broker_name ?? "—"}</td>
                          <td>{p.margin_equity != null ? formatMoneyIN(p.margin_equity, { decimals: 0 }) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="modal-action justify-start pt-0">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={addTradeCycles}
                    disabled={selectedProfiles.length === 0}
                  >
                    Add {selectedProfiles.length > 0 ? `${selectedProfiles.length} ` : ""}selected as trade cycles
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-base-content/50 py-4">
                Enter a search term and click Search to find profiles.
              </p>
            )}
          </div>
          <div
            className="modal-backdrop"
            onClick={closeAddCyclesModal}
            onKeyDown={(e) => e.key === "Escape" && closeAddCyclesModal()}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          />
        </div>
      )}

      {/* Existing Cycles */}
      <div className="mb-8">
        {/* <h3 className="font-bold mb-2">Existing Trade Cycles</h3> */}

        <div className="overflow-x-auto rounded-xl border border-base-300">
          <table className="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Cycle</th>
                <th>User</th>
                <th>Broker</th>
                <th>Risk</th>
                <th>Margin</th>
                <th>Qty x</th>
                <th>State</th>
                <th>Master</th>
                <th>Orders</th>
                <th>Positions</th>
                <th>PnL</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {trade_cycles.length > 0 ? (
                trade_cycles.map((cycle) => (
                  <tr key={cycle.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedCycles.includes(cycle.id)}
                        onChange={() => toggleCycle(cycle.id)}
                      />
                    </td>

                    <td>{cycle.id}</td>
                    <td>{cycle.client.username}</td>
                    <td>{cycle.profile.broker_name}</td>
                    <td>{cycle.profile.risk_profile}</td>
                    <td>{cycle.profile.margin_equity}</td>
                    <td>{cycle.profile.quantity_multiplier ?? 1}</td>
                    <td>
                      <span className="flex items-center gap-1">
                        {cycle.state === "LOCKED" && <span className="text-sm">{cycle.state}</span>}
                        {cycle.state !== "LOCKED" && <select
                          className="select select-bordered select-sm min-w-[7rem]"
                          value={cycle.state}
                          onChange={(e) => handleUpdateState(cycle.id, e.target.value)}
                          disabled={updatingState === cycle.id}
                        >
                          {TRADE_CYCLE_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select> }
                        {cycle.state === "LOCKED" && cycle.locked_reason && (
                          <span className="tooltip tooltip-right" data-tip={cycle.locked_reason}>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning text-warning-content text-[10px] font-bold cursor-default select-none">i</span>
                          </span>
                        )}
                        {updatingState === cycle.id && (
                          <span className="loading loading-spinner loading-xs"></span>
                        )}
                      </span>
                    </td>
                    <td>
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={cycle.is_master || false}
                          onChange={() => handleToggleMaster(cycle.id, cycle.is_master || false)}
                          disabled={
                            updatingMaster === cycle.id ||
                            (cycle.profile?.quantity_multiplier ?? 1) !== 1
                          }
                        />
                        {updatingMaster === cycle.id && (
                          <span className="loading loading-spinner loading-xs"></span>
                        )}
                      </label>
                    </td>
                    <td>{cycle.no_of_orders || 0}</td>
                    <td>{cycle.no_of_positions || 0}</td>
                    <td className={cycle.total_pnl != null && cycle.total_pnl > 0 ? "text-emerald-600 dark:text-emerald-400" : cycle.total_pnl != null && cycle.total_pnl < 0 ? "text-red-600 dark:text-red-400" : ""}>
                      {cycle.total_pnl !== null && cycle.total_pnl !== undefined ? formatMoneyIN(cycle.total_pnl) : formatMoneyIN(0)}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-row items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square"
                          title="View live positions & orders"
                          onClick={() => setLiveModalProfileId(cycle.profile.id)}
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleShowMore(cycle)}
                          className="btn btn-ghost btn-xs btn-square"
                          title="View trade cycle positions"
                        >
                          <LayoutList className="size-3.5" />
                        </button>
                        {cycle.state === "LOCKED" && (
                          <button
                            onClick={() => handleValidateAndActivate(cycle.id)}
                            disabled={validatingCycleId === cycle.id}
                            className="btn btn-primary btn-xs gap-1 shadow-none"
                            title="Validate and activate"
                          >
                            {validatingCycleId === cycle.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <><Zap className="size-3.5" /> Activate</>
                            )}
                          </button>
                        )}
                        {!cycle.is_master && (
                          <button
                            onClick={() => handleCompareMaster(cycle.id)}
                            disabled={comparingCycleId === cycle.id}
                            className="btn btn-ghost btn-xs btn-square"
                            title={cycle.is_master ? "Master cannot compare to itself" : "Compare with master"}
                          >
                            {comparingCycleId === cycle.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <GitCompare className="size-3.5" />
                            )}
                          </button>
                        )}
                        {!cycle.is_master && compareAllStatus[cycle.id] === "action_required" && (
                          <button
                            className="btn btn-error btn-xs btn-square"
                            title="Action required"
                            onClick={() => setCompareModalCycleId(cycle.id)}
                          >
                            <span className="text-[10px]">⚠</span>
                          </button>
                        )}
                      </div>
                      {comparingCycleId === cycle.id && compareStepMessage && (
                        <span className="text-[10px] text-base-content/60 block mt-0.5">{compareStepMessage}</span>
                      )}
                      {!cycle.is_master && compareAllStatus[cycle.id] && compareAllStatus[cycle.id] !== "action_required" && (
                        <span className="inline-block mt-0.5">
                          {compareAllStatus[cycle.id] === "running" && (
                            <span className="badge badge-ghost badge-xs gap-0.5">
                              <span className="loading loading-spinner loading-xs" /> Checking
                            </span>
                          )}
                          {compareAllStatus[cycle.id] === "no_action" && (
                            <span className="badge badge-success badge-xs">✓ No action</span>
                          )}
                          {compareAllStatus[cycle.id] === "error" && (
                            <span className="badge badge-error badge-outline badge-xs">Error</span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="text-center opacity-60">
                    No trade cycles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete button */}
      <button onClick={deleteTradeCycles} className="btn btn-error btn-sm ">
        Remove Selected Cycles
      </button>

      {/* Trade Cycle Details Modal */}
      {showModal && selectedTradeCycleId && (
        <Suspense fallback={<div className="modal modal-open"><div className="modal-box"><span className="loading loading-spinner loading-lg"></span></div></div>}>
          <TradeCycleDetailsModal
            tradeCycleId={selectedTradeCycleId}
            tradeCycle={selectedTradeCycle}
            
            onClose={handleCloseModal}
          />
        </Suspense>
      )}

      {liveModalProfileId !== null && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-base-100/80 backdrop-blur-sm">
              <span className="loading loading-spinner loading-lg" />
            </div>
          }
        >
          <ProfileLiveModal profileId={liveModalProfileId} onClose={handleCloseLiveModal} />
        </Suspense>
      )}

      {compareModalCycleId !== null && compareResults[compareModalCycleId] && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-semibold text-lg mb-2">Compare With Master</h3>
            <div className="text-sm mb-4">
              <div>
                Missing: {compareResults[compareModalCycleId].missing_in_trade_cycle},{" "}
                Extra: {compareResults[compareModalCycleId].extra_in_trade_cycle},{" "}
                Buy: {compareResults[compareModalCycleId].buy_quantity_mismatches},{" "}
                Sell: {compareResults[compareModalCycleId].sell_quantity_mismatches}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">Missing Instruments</div>
                {compareResults[compareModalCycleId].missing_details &&
                compareResults[compareModalCycleId].missing_details.length > 0 ? (
                  <div className="space-y-2">
                    {compareResults[compareModalCycleId].missing_details?.map((item) => {
                      const cycle = trade_cycles.find((c) => c.id === compareModalCycleId);
                      if (!cycle) {
                        return null;
                      }
                      const quantityMultiplier = cycle.profile?.quantity_multiplier ?? 1;
                      const effectiveMultiplier = multiplierAllowed ? quantityMultiplier : 1;

                      const masterNetBase =
                        (item.master_buy_quantity ?? 0) - (item.master_sell_quantity ?? 0);
                      const targetNetActual = masterNetBase * effectiveMultiplier;
                      if (targetNetActual === 0) {
                        return null;
                      }

                      const baseQty = Math.abs(targetNetActual) / (effectiveMultiplier || 1);
                      if (baseQty <= 0) {
                        return null;
                      }

                      const displayQty = Math.abs(targetNetActual);
                      const actionKey = targetNetActual > 0
                        ? `${cycle.id}-${item.instrument}-BUY`
                        : targetNetActual < 0
                          ? `${cycle.id}-${item.instrument}-SELL`
                          : null;
                      const qtyText = [item.master_buy_quantity > 0 && `Buy: ${item.master_buy_quantity}`, item.master_sell_quantity > 0 && `Sell: ${item.master_sell_quantity}`].filter(Boolean).join(", ") || "—";
                      return (
                        <div
                          key={`missing-${item.instrument}`}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-warning badge-outline">{item.instrument}</span>
                            <span className="opacity-80 text-xs">({qtyText})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {targetNetActual > 0 && (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "BUY",
                                    Math.round(baseQty),
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === actionKey || completedOrders.has(actionKey!)}
                              >
                                {placingCompareOrder === actionKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(actionKey!) ? (
                                  "✓ Placed"
                                ) : (
                                  `Buy ${displayQty}`
                                )}
                              </button>
                            )}
                            {targetNetActual < 0 && (
                              <button
                                className="btn btn-xs btn-secondary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "SELL",
                                    Math.round(baseQty),
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === actionKey || completedOrders.has(actionKey!)}
                              >
                                {placingCompareOrder === actionKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(actionKey!) ? (
                                  "✓ Placed"
                                ) : (
                                  `Sell ${displayQty}`
                                )}
                              </button>
                            )}
                            {targetNetActual === 0 && (
                              <span className="text-xs opacity-60">No action (net 0)</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="opacity-60">None</div>
                )}
              </div>

              <div>
                <div className="font-medium mb-1">Extra Instruments</div>
                {compareResults[compareModalCycleId].extra_details &&
                compareResults[compareModalCycleId].extra_details.length > 0 ? (
                  <div className="space-y-2">
                    {compareResults[compareModalCycleId].extra_details?.map((item) => {
                      const cycle = trade_cycles.find((c) => c.id === compareModalCycleId);
                      if (!cycle) return null;

                      const quantityMultiplier = cycle.profile?.quantity_multiplier ?? 1;
                      const effectiveMultiplier = multiplierAllowed ? quantityMultiplier : 1;

                      const netActual =
                        (item.trade_cycle_buy_quantity ?? 0) -
                        (item.trade_cycle_sell_quantity ?? 0);
                      const diffActual = 0 - netActual; // target is 0
                      const baseQty = Math.abs(diffActual) / (effectiveMultiplier || 1);
                      if (baseQty <= 0) {
                        return null;
                      }

                      const displayQty = Math.abs(diffActual);
                      const qtyText = [item.trade_cycle_buy_quantity > 0 && `Buy: ${item.trade_cycle_buy_quantity}`, item.trade_cycle_sell_quantity > 0 && `Sell: ${item.trade_cycle_sell_quantity}`].filter(Boolean).join(", ") || "—";
                      const instrumentForOrder = item.master_instrument ?? item.instrument;
                      const actionKey = diffActual > 0
                        ? `${cycle.id}-${instrumentForOrder}-BUY`
                        : `${cycle.id}-${instrumentForOrder}-SELL`;
                      return (
                        <div
                          key={`extra-${item.instrument}`}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-error badge-outline">{item.instrument}</span>
                            <span className="opacity-80 text-xs">({qtyText})</span>
                          </div>
                          {cycle && (
                            <div className="flex flex-wrap gap-2">
                              {diffActual < 0 ? (
                                <button
                                  className="btn btn-xs btn-secondary"
                                  onClick={() =>
                                    handlePlaceCompareOrder(
                                      cycle,
                                      instrumentForOrder,
                                      "SELL",
                                      Math.round(baseQty),
                                      item.exchange
                                    )
                                  }
                                  disabled={placingCompareOrder === actionKey || completedOrders.has(actionKey)}
                                >
                                  {placingCompareOrder === actionKey ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : completedOrders.has(actionKey) ? (
                                    "✓ Placed"
                                  ) : (
                                    `Sell ${displayQty}`
                                  )}
                                </button>
                              ) : diffActual > 0 ? (
                                <button
                                  className="btn btn-xs btn-primary"
                                  onClick={() =>
                                    handlePlaceCompareOrder(
                                      cycle,
                                      instrumentForOrder,
                                      "BUY",
                                      Math.round(baseQty),
                                      item.exchange
                                    )
                                  }
                                  disabled={placingCompareOrder === actionKey || completedOrders.has(actionKey)}
                                >
                                  {placingCompareOrder === actionKey ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : completedOrders.has(actionKey) ? (
                                    "✓ Placed"
                                  ) : (
                                    `Buy ${displayQty}`
                                  )}
                                </button>
                              ) : (
                                <span className="text-xs opacity-60">No action (net 0)</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="opacity-60">None</div>
                )}
              </div>

              <div>
                <div className="font-medium mb-1">Buy/Sell Quantity Mismatches</div>
                {compareResults[compareModalCycleId].quantity_mismatch_details &&
                compareResults[compareModalCycleId].quantity_mismatch_details.length > 0 ? (
                  <div className="space-y-2">
                    {compareResults[compareModalCycleId].quantity_mismatch_details?.map((item) => {
                      const cycle = trade_cycles.find((c) => c.id === compareModalCycleId);
                      if (!cycle) return null;

                      const quantityMultiplier = cycle.profile?.quantity_multiplier ?? 1;
                      const effectiveMultiplier = multiplierAllowed ? quantityMultiplier : 1;

                      const masterNetBase =
                        (item.master_buy_quantity ?? 0) - (item.master_sell_quantity ?? 0);
                      const tcNetActual =
                        (item.trade_cycle_buy_quantity ?? 0) -
                        (item.trade_cycle_sell_quantity ?? 0);
                      const targetNetActual = masterNetBase * effectiveMultiplier;

                      if (targetNetActual === tcNetActual) {
                        return (
                          <div
                            key={`qty-${item.instrument}`}
                            className="flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="flex flex-col">
                              <span className="badge badge-info badge-outline">
                                {item.user_instrument || item.instrument}
                              </span>
                              <span className="text-xs opacity-70 mt-1">
                                B: {item.trade_cycle_buy_quantity}/
                                {item.master_buy_quantity * effectiveMultiplier} • S:{" "}
                                {item.trade_cycle_sell_quantity}/
                                {item.master_sell_quantity * effectiveMultiplier} (Net equal)
                              </span>
                            </div>
                            <span className="text-xs opacity-60">No action</span>
                          </div>
                        );
                      }

                      const diffActual = targetNetActual - tcNetActual;
                      const baseQty = Math.abs(diffActual) / (effectiveMultiplier || 1);
                      if (baseQty <= 0) return null;

                      const displayQty = Math.abs(diffActual);
                      const actionKey = diffActual > 0
                        ? `${cycle.id}-${item.instrument}-BUY`
                        : `${cycle.id}-${item.instrument}-SELL`;

                      return (
                        <div
                          key={`qty-${item.instrument}`}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex flex-col">
                            <span className="badge badge-info badge-outline">
                              {item.user_instrument || item.instrument}
                            </span>
                            <span className="text-xs opacity-70 mt-1">
                              B: {item.trade_cycle_buy_quantity}/{item.master_buy_quantity} • S:{" "}
                              {item.trade_cycle_sell_quantity}/{item.master_sell_quantity} (Net: {tcNetActual} → {targetNetActual})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {diffActual > 0 ? (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "BUY",
                                    Math.round(baseQty),
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === actionKey || completedOrders.has(actionKey)}
                              >
                                {placingCompareOrder === actionKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(actionKey) ? (
                                  "✓ Placed"
                                ) : (
                                  `Buy ${displayQty}`
                                )}
                              </button>
                            ) : (
                              <button
                                className="btn btn-xs btn-secondary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "SELL",
                                    Math.round(baseQty),
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === actionKey || completedOrders.has(actionKey)}
                              >
                                {placingCompareOrder === actionKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(actionKey) ? (
                                  "✓ Placed"
                                ) : (
                                  `Sell ${displayQty}`
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="opacity-60">None</div>
                )}
              </div>
            </div>

            <div className="modal-action">
              {(() => {
                const cycle = trade_cycles.find((c) => c.id === compareModalCycleId);
                const matchAllItems = cycle ? getMatchAllItems(cycle.id) : [];
                return (
                  <>
                    {matchAllItems.length > 0 && (
                      <button
                        className="btn btn-primary"
                        onClick={() => cycle && handlePlaceMatchAll(cycle)}
                        disabled={placingMatchAllCycleId === compareModalCycleId}
                      >
                        {placingMatchAllCycleId === compareModalCycleId ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          `Match All (${matchAllItems.length} order${matchAllItems.length !== 1 ? "s" : ""})`
                        )}
                      </button>
                    )}
                    <button className="btn" onClick={() => setCompareModalCycleId(null)}>
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
