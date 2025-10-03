// pages/positions/index.tsx (All Positions Page with Cards)

// app/hedgium/trade-cycles/page.tsx
"use client";

import React, {useEffect, useState} from "react";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import Slider from "@/components/Slider"; // ✅ the reusable slider we made
import { authFetch } from "@/utils/api";

type TradeCycle = {
  id: string;
  name: string;
  description: string;
  state: "NEW" | "PENDING" | "COMPLETED" | "STOPPED";
  sub_state: string;
  created_at: string;
  updated_at: string;
};

export default function TradeCyclesPage() {

  const [tradeCycles, setTradeCycles] = useState<TradeCycle[]>([]);

  const totalPnl = 3000;
  const totalPnlPercentage = 10;

  async function getAllTradeCycles () {
    const res = await authFetch("trade-cycles/?state=ACTIVATED");
    const data = await res.json();
    console.log(data);
    setTradeCycles(data.results);
  }

  useEffect(()=>{
    getAllTradeCycles();
  },[])

  return (
    <div className="p-4 hero-pattern">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Trading Dashboard</h1>
            <p className="text-gray-600">Monitor your algorithmic trading performance</p>
          </div>
          <div className="stats bg-base-100 shadow-md mt-4 md:mt-0">
            <div className="stat">
              <div className="stat-title">Total P&L</div>
              <div className={`stat-value ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="stat-desc">
                <span className={totalPnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {totalPnlPercentage >= 0 ? '+' : ''}{totalPnlPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

      <h2 className="text-2xl font-bold mb-6">Trade Cycles</h2>
      <Slider>
        {tradeCycles.map((cycle) => (
          <TradeCycleWithPositionsCard key={cycle.id} tradeCycle={cycle} />
        ))}
      </Slider>

      <br />
      <br />
    </div>
  );
}