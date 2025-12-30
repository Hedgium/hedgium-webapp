"use client";

import { useState, lazy, Suspense } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { RotateCw, Eye } from "lucide-react";

// Lazy load the modal component
const TradeCycleDetailsModal = lazy(() => import("./TradeCycleDetailsModal"));


export default function TradeCycles({ id, trade_cycles, fetchTradeCycles }) {
  const [selectedCycles, setSelectedCycles] = useState<number[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]); // 🔥 NEW → search results list
  const [refreshing, setRefreshing] = useState(false);
  const [validatingCycleId, setValidatingCycleId] = useState<number | null>(null);
  const [updatingMaster, setUpdatingMaster] = useState<number | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTradeCycleId, setSelectedTradeCycleId] = useState<number | null>(null);

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
  function handleShowMore(cycleId: number) {
    setSelectedTradeCycleId(cycleId);
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
    } catch (error: any) {
      console.error("Validation error:", error);
      const errorMsg = error.message || "Failed to trigger validation";
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
    } catch (error: any) {
      console.error("Toggle master error:", error);
      alert.error(error?.message || "Failed to update master status", { duration: 3000 });
    } finally {
      setUpdatingMaster(null);
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

                    <td>{cycle.name}</td>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowMore(cycle.id)}
                          className="btn btn-ghost btn-xs"
                          title="Show More Details"
                        >
                          <Eye size={16} />
                          Show More
                        </button>
                        {cycle.state === "LOCKED" && (
                          <button
                            onClick={() => handleValidateAndActivate(cycle.id)}
                            disabled={validatingCycleId === cycle.id}
                            className="btn btn-primary btn-xs"
                            title="Validate and Activate"
                          >
                            {validatingCycleId === cycle.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Activate"
                            )}
                          </button>
                        )}
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
            onClose={handleCloseModal}
          />
        </Suspense>
      )}
    </div>
  );
}
