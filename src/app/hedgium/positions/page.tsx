// pages/positions/index.tsx (All Positions Page with Cards)

 

// app/hedgium/trade-cycles/page.tsx
"use client";

import React from "react";
import TradeCycleWithPositionsCard from "@/components/TradeCyclePositions";
import Slider from "@/components/Slider"; // ✅ the reusable slider we made

// Dummy data for demo
const tradeCycles = [
  {
    id: 1,
    name: "NIFTY Option Strategy",
    description: "Iron Fly Strategy",
    state: "PENDING" as const,
    sub_state: "RUNNING",
    created_at: "2025-09-01T10:30:00Z",
    positions: [
      {
        id: 101,
        symbol: "NIFTY23SEP18000CE",
        quantity: 50,
        entryPrice: 120,
        currentPrice: 135,
        side: "SELL" as const,
        status: "OPEN" as const,
      },
      {
        id: 102,
        symbol: "NIFTY23SEP18200PE",
        quantity: 50,
        entryPrice: 110,
        currentPrice: 95,
        side: "BUY" as const,
        status: "OPEN" as const,
      },
      {
        id: 103,
        symbol: "NIFTY23SEP18300CE",
        quantity: 25,
        entryPrice: 80,
        currentPrice: 60,
        side: "BUY" as const,
        status: "OPEN" as const,
      },
    ],
  },
  {
    id: 2,
    name: "BANKNIFTY Strategy",
    description: "Straddle with hedge",
    state: "NEW" as const,
    sub_state: "WAITING",
    created_at: "2025-09-02T11:15:00Z",
    positions: [
      {
        id: 201,
        symbol: "BANKNIFTY23SEP43000CE",
        quantity: 15,
        entryPrice: 200,
        currentPrice: 240,
        side: "SELL" as const,
        status: "OPEN" as const,
      },
      {
        id: 202,
        symbol: "BANKNIFTY23SEP43000PE",
        quantity: 15,
        entryPrice: 220,
        currentPrice: 190,
        side: "BUY" as const,
        status: "OPEN" as const,
      },
    ],
  },
];

export default function TradeCyclesPage() {

  const totalPnl = 3000;
  const totalPnlPercentage = 10 
  return (
    <div className="p-4">

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
    </div>
  );
}

