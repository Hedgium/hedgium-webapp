"use client";

import { useState, lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { RotateCw, Eye } from "lucide-react";
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

type TradeCycleProfile = {
  id: number;
  broker_name?: string | null;
  risk_profile?: string | null;
  margin_equity?: number | null;
};

type TradeCycleClient = {
  username: string;
};

type TradeCycle = {
  id: number;
  client: TradeCycleClient;
  profile: TradeCycleProfile;
  state: string;
  is_master?: boolean | null;
  no_of_orders?: number | null;
  no_of_positions?: number | null;
  pnl?: number | null;
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
};

export default function TradeCycles({
  id,
  trade_cycles,
  fetchTradeCycles,
}: TradeCyclesProps) {
  const [selectedCycles, setSelectedCycles] = useState<number[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<SearchProfile[]>([]); // 🔥 NEW → search results list
  const [refreshing, setRefreshing] = useState(false);
  const [validatingCycleId, setValidatingCycleId] = useState<number | null>(null);
  const [updatingMaster, setUpdatingMaster] = useState<number | null>(null);
  const [comparingCycleId, setComparingCycleId] = useState<number | null>(null);
  const [compareResults, setCompareResults] = useState<Record<number, CompareResult>>({});
  const [compareErrors, setCompareErrors] = useState<Record<number, string>>({});
  const [compareStepMessage, setCompareStepMessage] = useState<string | null>(null);
  const [compareModalCycleId, setCompareModalCycleId] = useState<number | null>(null);
  const [placingCompareOrder, setPlacingCompareOrder] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTradeCycleId, setSelectedTradeCycleId] = useState<number | null>(null);
  const [selectedTradeCycle, setSelectedTradeCycle] = useState<{ id: number; profile_id?: number } | null>(null);

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
      setProfiles([]); // Clear search results
      setSelectedProfiles([]); // Clear selected profiles

      alert.success("Trade cycles created!", { duration: 3000 });

    } catch (error) {
      console.error("Create error:", error);
    }
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

  async function handleCompareMaster(cycleId: number) {
    if (comparingCycleId === cycleId) return;
    const cycle = trade_cycles.find((c) => c.id === cycleId);
    if (!cycle?.profile?.id) {
      alert.error("Trade cycle or profile not found");
      return;
    }
    setComparingCycleId(cycleId);
    setCompareStepMessage(null);
    setCompareErrors((prev) => {
      const next = { ...prev };
      delete next[cycleId];
      return next;
    });
    setCompletedOrders(new Set());
    try {
      setCompareStepMessage("Loading master info…");
      const infoRes = await authFetch(`trade-cycles/${cycleId}/master-info/`);
      const info = await infoRes.json();
      if (!infoRes.ok) {
        throw new Error(info.detail || "Failed to get master info");
      }
      const { master_profile_id, trade_cycle_profile_id } = info as {
        master_profile_id: number;
        trade_cycle_profile_id: number;
      };

      setCompareStepMessage("Refreshing master position…");
      await refreshProfilePositionsAndWait(master_profile_id);

      setCompareStepMessage("Refreshing trade cycle position…");
      await refreshProfilePositionsAndWait(trade_cycle_profile_id);

      setCompareStepMessage("Comparing with master…");
      const res = await authFetch(`trade-cycles/${cycleId}/match-master-positions/`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setCompareResults((prev) => ({ ...prev, [cycleId]: data }));
        setCompareModalCycleId(cycleId);
        alert.success("Comparison completed", { duration: 2000 });
      } else {
        const message = data.detail || "Failed to compare with master";
        setCompareErrors((prev) => ({ ...prev, [cycleId]: message }));
        alert.error(message, { duration: 3000 });
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to compare with master";
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
          `Order placed: ${orderInfo.action} ${orderInfo.quantity} ${orderInfo.instrument} @ ₹${orderInfo.price}`
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-semibold">Trade Cycles</h4>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`btn btn-ghost btn-sm ${refreshing ? "animate-spin" : ""}`}
          title="Refresh Trade Cycles"
        >
          <RotateCw size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search profiles..."
          className="input input-bordered w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="btn btn-secondary" onClick={searchTradeCycles}>
          Search
        </button>
      </div>


      {/* Searched Profiles */}
      {profiles.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Profiles Found</h3>

          <div className="overflow-x-auto shadow rounded-xl">
            <table className="table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Email</th>
                  <th>Broker</th>
                  <th>Margin Equity</th>
                </tr>
              </thead>

              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedProfiles.includes(p.id)}
                        onChange={() => toggleProfile(p.id)}
                      />
                    </td>
                    <td>{p.user.email}</td>
                    <td>{p.broker_name}</td>
                    <td>{p.margin_equity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-primary btn-sm mt-4" onClick={addTradeCycles}>
            Add Selected Profiles as Trade Cycles
          </button>
          <br />
          <br />
        </div>
      )}



      {/* Existing Cycles */}
      <div className="mb-8">
        {/* <h3 className="font-bold mb-2">Existing Trade Cycles</h3> */}

        <div className="overflow-x-auto shadow rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Cycle</th>
                <th>User</th>
                <th>Broker</th>
                <th>Risk</th>
                <th>Margin</th>
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
                    <td>{cycle.state}</td>
                    <td>
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={cycle.is_master || false}
                          onChange={() => handleToggleMaster(cycle.id, cycle.is_master || false)}
                          disabled={updatingMaster === cycle.id}
                        />
                        {updatingMaster === cycle.id && (
                          <span className="loading loading-spinner loading-xs"></span>
                        )}
                      </label>
                    </td>
                    <td>{cycle.no_of_orders || 0}</td>
                    <td>{cycle.no_of_positions || 0}</td>
                    <td className={cycle.pnl && cycle.pnl > 0 ? "text-green-400" : cycle.pnl && cycle.pnl < 0 ? "text-red-400" : ""}>
                      {cycle.pnl !== null && cycle.pnl !== undefined ? `₹${cycle.pnl.toFixed(2)}` : "₹0.00"}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 w-full">
                        <Link href={`/admin/profiles/${cycle.profile.id}/live`} className="w-full">
                          <button
                            className="btn btn-outline btn-sm w-full"
                            title="View Live Positions & Orders"
                          >ViewLive
                          </button>
                        </Link>
                        
                        <button
                          onClick={() => handleShowMore(cycle)}
                          className="btn btn-sm w-full"
                          title="View Trade Cycle Positions"
                        >
                          Positions
                        </button>
                        
                        {cycle.state === "LOCKED" && (
                          <button
                            onClick={() => handleValidateAndActivate(cycle.id)}
                            disabled={validatingCycleId === cycle.id}
                            className="btn btn-primary btn-sm w-full"
                            title="Validate and Activate"
                          >
                            {validatingCycleId === cycle.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Activate"
                            )}
                          </button>
                        )}

                        <div className="flex flex-col gap-0.5 w-full">
                          <button
                            onClick={() => handleCompareMaster(cycle.id)}
                            disabled={cycle.is_master || comparingCycleId === cycle.id}
                            className="btn btn-outline btn-sm w-full"
                            title={
                              cycle.is_master
                                ? "Master trade cycle cannot be compared to itself"
                                : "Compare positions with master trade cycle"
                            }
                          >
                            {comparingCycleId === cycle.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Compare Master"
                            )}
                          </button>
                          {comparingCycleId === cycle.id && compareStepMessage && (
                            <span className="text-xs opacity-80 text-center">
                              {compareStepMessage}
                            </span>
                          )}
                        </div>

                      
                      </div>
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
                      const netQty = item.master_buy_quantity - item.master_sell_quantity;
                      const actionKey = netQty > 0
                        ? `${cycle.id}-${item.instrument}-BUY`
                        : netQty < 0
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
                            {netQty > 0 && (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "BUY",
                                    netQty,
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
                                  `Buy ${netQty}`
                                )}
                              </button>
                            )}
                            {netQty < 0 && (
                              <button
                                className="btn btn-xs btn-secondary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "SELL",
                                    Math.abs(netQty),
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
                                  `Sell ${Math.abs(netQty)}`
                                )}
                              </button>
                            )}
                            {netQty === 0 && (
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
                      const qtyText = [item.trade_cycle_buy_quantity > 0 && `Buy: ${item.trade_cycle_buy_quantity}`, item.trade_cycle_sell_quantity > 0 && `Sell: ${item.trade_cycle_sell_quantity}`].filter(Boolean).join(", ") || "—";
                      return (
                        <div key={`extra-${item.instrument}`} className="flex flex-wrap items-center gap-2">
                          <span className="badge badge-error badge-outline">{item.instrument}</span>
                          <span className="opacity-80 text-xs">({qtyText})</span>
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

                      // Calculate differences
                      const buyDiff = item.master_buy_quantity - item.trade_cycle_buy_quantity;
                      const sellDiff = item.master_sell_quantity - item.trade_cycle_sell_quantity;

                      const buyKey = `${cycle.id}-${item.instrument}-BUY`;
                      const sellKey = `${cycle.id}-${item.instrument}-SELL`;

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
                              {item.trade_cycle_sell_quantity}/{item.master_sell_quantity}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {/* Need to BUY more */}
                            {buyDiff > 0 && (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "BUY",
                                    buyDiff,
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === buyKey || completedOrders.has(buyKey)}
                              >
                                {placingCompareOrder === buyKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(buyKey) ? (
                                  "✓ Placed"
                                ) : (
                                  `Buy ${buyDiff}`
                                )}
                              </button>
                            )}
                            {/* Need to SELL excess */}
                            {buyDiff < 0 && (
                              <button
                                className="btn btn-xs btn-warning"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "SELL",
                                    Math.abs(buyDiff),
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === sellKey || completedOrders.has(sellKey)}
                              >
                                {placingCompareOrder === sellKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(sellKey) ? (
                                  "✓ Placed"
                                ) : (
                                  `Sell ${Math.abs(buyDiff)} (excess)`
                                )}
                              </button>
                            )}
                            {/* Need to SELL more */}
                            {sellDiff > 0 && (
                              <button
                                className="btn btn-xs btn-secondary"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "SELL",
                                    sellDiff,
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === sellKey || completedOrders.has(sellKey)}
                              >
                                {placingCompareOrder === sellKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(sellKey) ? (
                                  "✓ Placed"
                                ) : (
                                  `Sell ${sellDiff}`
                                )}
                              </button>
                            )}
                            {/* Need to BUY back excess sells */}
                            {sellDiff < 0 && (
                              <button
                                className="btn btn-xs btn-warning"
                                onClick={() =>
                                  handlePlaceCompareOrder(
                                    cycle,
                                    item.instrument,
                                    "BUY",
                                    Math.abs(sellDiff),
                                    item.exchange
                                  )
                                }
                                disabled={placingCompareOrder === buyKey || completedOrders.has(buyKey)}
                              >
                                {placingCompareOrder === buyKey ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : completedOrders.has(buyKey) ? (
                                  "✓ Placed"
                                ) : (
                                  `Buy ${Math.abs(sellDiff)} (cover)`
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
              <button className="btn" onClick={() => setCompareModalCycleId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
