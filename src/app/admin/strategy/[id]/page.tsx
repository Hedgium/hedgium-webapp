"use client";

import React, { useState } from "react";


// ----------------------------------------------------
import { useParams } from "next/navigation";
import { authFetch } from "@/utils/api";
import Adjustments from "@/components/admin/Adjustments";
import Link from "next/link";
import TradeCycles from "@/components/admin/TradeCycles";
import { formatDateOnly } from "@/utils/formatDate";


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
        <div className="py-2">
          <h3 className="text-2xl font-bold">{strategy.name}</h3>
          <p className="mt-1 text-sm opacity-80">{strategy.description}</p>

          <p className="text-xs mt-1">
            <b>Validity:</b> {formatDateOnly(strategy.validity_start)}

            {strategy.source && (
            <span className="text-xs opacity-70">Source: {strategy.source}</span>
          )}

          </p>
          
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Adjustments</div>
            <div className="stat-value text-2xl">{strategy.adjustment_count ?? 0}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Legs</div>
            <div className="stat-value text-2xl">{strategy.leg_count ?? 0}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Trade Cycles</div>
            <div className="stat-value text-2xl">{strategy.trade_cycle_count ?? 0}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Total PnL</div>
            <div className={`stat-value text-2xl ${
              strategy.total_pnl !== null && strategy.total_pnl !== undefined
                ? strategy.total_pnl > 0 
                  ? "text-green-400" 
                  : strategy.total_pnl < 0 
                    ? "text-red-400" 
                    : ""
                : ""
            }`}>
              {strategy.total_pnl !== null && strategy.total_pnl !== undefined
                ? `₹${Number(strategy.total_pnl).toFixed(2)}`
                : "—"}
            </div>
          </div>
        </div>
      </div>

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
