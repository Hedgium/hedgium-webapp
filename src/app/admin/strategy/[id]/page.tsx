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

      console.log("Fetched trade cycles data:", data);
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


  if (loading) return <div className="p-6">Loading strategy details...</div>;

  return (
    <div className="p-6 space-y-10">

      <Link href="/admin" className="btn btn-ghost mb-4">
        {`← Back to Admin Dashboard`}
      </Link>
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
        <h4 className="text-xl font-semibold mb-3">Strategy Adjustments</h4>
        <Adjustments adjustments={strategy.versions} />
      </div>

      <hr className="border-base-300" />


      {/* TRADE CYCLES TABLE */}
      {tradeCyclesLoading ? (
        <div>Loading trade cycles...</div>
      ) : <TradeCycles id={id} trade_cycles={trade_cycles} fetchTradeCycles={fetchTradeCycles} />}

    </div>
  );
}
