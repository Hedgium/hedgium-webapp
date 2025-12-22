"use client";

import React, { useState } from "react";


// ----------------------------------------------------
import { useParams } from "next/navigation";
import { authFetch } from "@/utils/api";
import Adjustments from "@/components/admin/Adjustments";
import Link from "next/link";
import TradeCycles from "@/components/admin/TradeCycles";


export default function StrategyDetail() {

  const [strategy, setStrategy] = useState(null);
  const [trade_cycles, setTradeCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeCyclesLoading, setTradeCyclesLoading] = useState(false);

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
      setTradeCyclesLoading(true);
      const res = await authFetch(`myadmin/trade-cycles/${id}/?page=1&page_size=100`);
      const data = await res.json();

      // console.log("Fetched trade cycles data:", data);
      // console.log("Fetched trade cycles data:", data);
      setTradeCycles(data.results);

    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      setTradeCyclesLoading(false);
    }
  }


  React.useEffect(() => {
    // Reset selections when strategy changes (if applicable)
    fetchStrategyData();
    fetchTradeCycles();
  }, [id]);


  if (loading) return <div className="p-4">Loading strategy details...</div>;

  return (
    <div className="p-4 space-y-4">

      <Link href="/admin/strategy" className="btn btn-sm btn-outline btn-ghost mb-2">
        {`← Back`}
      </Link>
      {/* HEADER */}
      <div className="space-y-2">
        <div>
          <h3 className="text-2xl font-bold">{strategy.name}</h3>
          <p className="mt-1 text-sm opacity-80">{strategy.description}</p>

          <p className="text-xs mt-1">
            <b>Valid:</b> {strategy.validity_start} → {strategy.validity_end}
          </p>
          {strategy.source && (
            <p className="text-xs opacity-70">Source: {strategy.source}</p>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-base-200">
          <table className="table table-xs">
            <thead>
              <tr className="bg-base-200">
                <th>Adjustments</th>
                <th>Legs</th>
                <th>Trade Cycles</th>
                <th>Total PnL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{strategy.adjustment_count ?? 0}</td>
                <td>{strategy.leg_count ?? 0}</td>
                <td>{strategy.trade_cycle_count ?? 0}</td>
                <td>
                  {strategy.total_pnl !== null && strategy.total_pnl !== undefined
                    ? Number(strategy.total_pnl).toFixed(2)
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-base-300" />

      {/* LEGS TABLE */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Strategy Adjustments</h4>
        <Adjustments adjustments={strategy.versions} />
      </div>

      <hr className="border-base-300" />


      {/* TRADE CYCLES TABLE */}
      {tradeCyclesLoading ? (
        <div className="text-sm">Loading trade cycles...</div>
      ) : <TradeCycles id={id} trade_cycles={trade_cycles} fetchTradeCycles={fetchTradeCycles} />}

    </div>
  );
}
