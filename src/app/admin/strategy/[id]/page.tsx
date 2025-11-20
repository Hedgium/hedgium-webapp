"use client";

import React, { useState } from "react";


// ----------------------------------------------------
import { useParams } from "next/navigation";
import { authFetch } from "@/utils/api";


export default function StrategyDetail() {

  const [strategy, setStrategy] = useState(null);
  const [trade_cycles, setTradeCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycles, setSelectedCycles] = useState<number[]>([]);

  const params = useParams<{ id: string }>();
  const { id } = params;


  async function fetchStrategyData() {
    setLoading(true);
    try {
      const res = await authFetch(`myadmin/strategies/${id}/`);
      const data = await res.json();
      // console.log("Fetched strategy data:", data);
      setStrategy(data);
    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTradeCycles() {
    try {
      const res = await authFetch(`myadmin/trade-cycles/${id}/?page=1&page_size=100`);
      const data = await res.json();
      // console.log("Fetched trade cycles data:", data);
      setTradeCycles(data.results);
    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
    }
  }

  async function toggleCycle(cycleId: number) {
    if (!selectedCycles.includes(cycleId)) {
      setSelectedCycles([...selectedCycles, cycleId]);
    } else {
      setSelectedCycles(selectedCycles.filter((id) => id !== cycleId));
    }
  }

  async function deleteTradeCycles() {
    
    try {
      const res = await authFetch(`myadmin/delete-trade-cycles/${id}/${selectedCycles.join(",")}/`, {
        method: "DELETE",
      });
      const data = await res.json();
      console.log("Deleted trade cycles:", data);
    } catch (error) {
      console.error("Error deleting trade cycles:", error);
    } finally {
      // Refresh trade cycles list
      fetchTradeCycles();
      setSelectedCycles([]);
    }
  }

  async function approveAdjustment(adjId: number) {
    console.log("Approving adjustment ID:", adjId);
    try {
      const res = await authFetch(`myadmin/approve-adjustment/${id}/`, {
        method: "POST",
        body: JSON.stringify({ adjustment_id: adjId }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("Approved adjustment response:", data);
      } catch (error) {
      console.error("Error approving adjustment:", error);
    } finally {
      // Refresh strategy data to reflect changes
      // fetchStrategyData();
      fetchTradeCycles();
    }

  }
  React.useEffect(() => {
    // Reset selections when strategy changes (if applicable)
    fetchStrategyData();
    fetchTradeCycles();
  }, [id]);


  if(loading) return <div className="p-6">Loading strategy details...</div>;

  return (
    <div className="p-6 space-y-10">

      {/* HEADER */}
      <div>
        <h3 className="text-3xl font-bold">{strategy.name}</h3>
        <p className="mt-1 opacity-80">{strategy.description}</p>

        <p className="text-sm mt-2">
          <b>Valid:</b> {strategy.validity_start} → {strategy.validity_end}
        </p>
        {strategy.source && (
          <p className="text-sm opacity-70">Source: {strategy.source}</p>
        )}
      </div>

      <hr className="border-base-300" />

      {/* LEGS TABLE */}
      <div>
        <h4 className="text-xl font-semibold mb-3">Legs</h4>

        <div className="overflow-x-auto shadow rounded-xl">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Version</th>
                <th>Leg #</th>
                <th>Action</th>
                <th>Instrument</th>
                <th>Qty</th>
                <th>Order Type</th>
                <th>Price</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {strategy.versions.map((adj) =>
                adj.legs.length > 0 ? (
                  adj.legs.map((leg) => (
                    <tr key={leg.id}>
                      <td>
                        v{adj.version}{" "}
                        <span className="badge badge-sm badge-info">
                          #{leg.id}
                        </span>
                      </td>
                      <td>{leg.leg_index}</td>
                      <td>{leg.action}</td>
                      <td>{leg.instrument}</td>
                      <td>{leg.quantity}</td>
                      <td>{leg.order_type}</td>
                      <td>{leg.price ?? "MKT"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline">
                          Save
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key={"empty-" + adj.id}>
                    <td colSpan={8} className="text-center opacity-60">
                      No legs found for v{adj.version}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-base-300" />

      {/* ADJUSTMENTS */}
      <div>
        <h4 className="text-xl font-semibold mb-3">Adjustments</h4>

        <div className="overflow-x-auto shadow rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Title</th>
                <th>Notes</th>
                <th>Auto Trade</th>
                <th>Approved</th>
                <th>Published</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {strategy.versions.map((adj) => (
                <tr key={adj.id}>
                  <td>v{adj.version}</td>
                  <td>{adj.title || "-"}</td>
                  <td>{adj.notes || "-"}</td>
                  <td>{adj.auto_trade ? "Yes" : "No"}</td>
                  <td>{adj.approved ? "Yes" : "No"}</td>
                  <td>{adj.created_at}</td>
                  <td>
                    {!adj.approved ? (
                      <button onClick={()=> approveAdjustment(adj.id)} className="btn btn-sm btn-success">
                        Approve
                      </button>
                    ) : (
                      <em className="opacity-60">Approved</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-base-300" />

  
      <hr className="border-base-300" />

      {/* TRADE CYCLES TABLE */}
      <div>
        <h4 className="text-xl font-semibold mb-3">Trade Cycles</h4>

        <div className="overflow-x-auto shadow rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Cycle</th>
                <th>User</th>
                <th>Broker Profile</th>
                <th>Risk Profile</th>
                <th>Margin</th>
                <th>State</th>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center opacity-60">
                    No trade cycles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button onClick={deleteTradeCycles} className="btn btn-error mt-4">
          Remove Selected Cycles
        </button>
      </div>
    </div>
  );
}
