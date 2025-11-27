"use client";

import { useState } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { RotateCw } from "lucide-react";


export default function TradeCycles({ id, trade_cycles, fetchTradeCycles }) {
  const [selectedCycles, setSelectedCycles] = useState<number[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]); // 🔥 NEW → search results list
  const [refreshing, setRefreshing] = useState(false);

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
                <th>Orders</th>
                <th>Positions</th>
                <th>PnL</th>
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
                    <td>{cycle.no_of_orders || 0}</td>
                    <td>{cycle.no_of_positions || 0}</td>
                    <td className={cycle.pnl && cycle.pnl > 0 ? "text-green-400" : cycle.pnl && cycle.pnl < 0 ? "text-red-400" : ""}>
                      {cycle.pnl !== null && cycle.pnl !== undefined ? `₹${cycle.pnl.toFixed(2)}` : "₹0.00"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center opacity-60">
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
    </div>
  );
}
