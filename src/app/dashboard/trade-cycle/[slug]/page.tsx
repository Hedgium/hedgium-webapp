
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";
import { authFetch } from "@/utils/api";

// ✅ Load chart only on client
const TradingViewChart = dynamic(
  () => import("@/components/TradingViewChart"),
  { ssr: false }
);

// ---------------- Types ----------------
interface TradeCycle {
  id: number;
  name: string;
  description?: string;
  state: string;
  sub_state: string;
  created_at: string;
}

interface Order {
  id: number;
  instrument: string;
  action: "BUY" | "SELL";
  type: string; // CE/PE/FUT
  strike?: number;
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
  filled: boolean;
}

interface Position {
  id: number;
  instrument: string;
  quantity: number;
  avg_price: number;
  ltp: number;
  pnl: number;
}

interface PaginatedResponse<T> {
  results: T[];
  next: string | null;
  previous: string | null;
  count: number;
}

// ---------------- Component ----------------
export default function StrategyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "positions"
  >("overview");

  const [tradeCycle, setTradeCycle] = useState<TradeCycle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [chartData, setChartData] = useState<
    { time: string; value: number }[] | null
  >(null);

  // ---------------- API ----------------
  async function getTradeCycle() {
    const res = await authFetch(`trade-cycles/${slug}/`);
    const data: TradeCycle = await res.json();
    setTradeCycle(data);
  }

  async function getOrders() {
    const res = await authFetch(
      `orders/?page=1&page_size=50&trade_cycle_id=${slug}`
    );
    const data: PaginatedResponse<Order> = await res.json();
    setOrders(data.results);
  }

  async function getPositions() {
    const res = await authFetch("positions/?page=1&page_size=50");
    const data: PaginatedResponse<Position> = await res.json();
    setPositions(data.results);
  }

  useEffect(() => {
    getTradeCycle();
    getOrders();
    getPositions();
  }, []);

  // ---------------- Helpers ----------------
  const totalPnl = orders.reduce((sum, o) => sum + o.pnl, 0);
  const totalPnlPercent = orders.length
    ? (
        orders.reduce((sum, o) => sum + o.pnl_percent, 0) / orders.length
      ).toFixed(2)
    : "0";

  // Example chart (replace with backend data later)
  useEffect(() => {
    setChartData([
      { time: "2025-09-10", value: 100000 },
      { time: "2025-09-11", value: 101200 },
      { time: "2025-09-12", value: 102400 },
      { time: "2025-09-13", value: 104500 },
      { time: "2025-09-14", value: 103800 },
      { time: "2025-09-15", value: 105000 },
    ]);
  }, []);

  // ---------------- UI Subcomponents ----------------
  const OrderRow = ({ order }: { order: Order }) => {
    const isProfit = order.pnl >= 0;
    return (
      <tr>
        <td>
          <span
            className={`font-semibold ${
              order.action === "BUY" ? "text-success" : "text-error"
            }`}
          >
            {order.action}
          </span>
        </td>
        <td>
          {order.strike ? `${order.strike} ` : ""}
          {order.type}
        </td>
        <td>{order.quantity}</td>
        <td>₹{order.entry_price}</td>
        <td>₹{order.current_price}</td>
        <td className={isProfit ? "text-success" : "text-error"}>
          {isProfit ? "+" : ""}₹{Math.abs(order.pnl).toLocaleString()}
        </td>
        <td className={isProfit ? "text-success" : "text-error"}>
          {isProfit ? "+" : ""}
          {order.pnl_percent}%
        </td>
        <td>
          {order.filled ? (
            <CheckCircle size={16} className="text-success" />
          ) : (
            <Clock size={16} className="text-warning" />
          )}
        </td>
      </tr>
    );
  };

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-circle mr-2"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Strategy Details</h1>
        </div>

        {/* TradeCycle Info */}
        {tradeCycle && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{tradeCycle.name}</h2>
            <p className="text-gray-500">
              State: {tradeCycle.state} | Sub: {tradeCycle.sub_state}
            </p>
            <p className="text-sm text-gray-400">
              Created: {new Date(tradeCycle.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs mb-6">
          <a
            className={`tab tab-bordered ${
              activeTab === "overview" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </a>
          <a
            className={`tab tab-bordered ${
              activeTab === "performance" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("performance")}
          >
            Performance
          </a>
          <a
            className={`tab tab-bordered ${
              activeTab === "positions" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("positions")}
          >
            Positions
          </a>
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="bg-base-100 shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Orders</h3>
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Instrument</th>
                  <th>Qty</th>
                  <th>Entry</th>
                  <th>LTP</th>
                  <th>PNL</th>
                  <th>PNL%</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </tbody>
            </table>

            <div className="mt-4 font-semibold">
              Total PnL:{" "}
              <span
                className={totalPnl >= 0 ? "text-success" : "text-error"}
              >
                {totalPnl >= 0 ? "+" : ""}
                ₹{totalPnl.toLocaleString()} ({totalPnlPercent}%)
              </span>
            </div>
          </div>
        )}

        {/* Performance */}
        {activeTab === "performance" && chartData && (
          <div className="bg-base-100 shadow rounded-lg p-4">
            <TradingViewChart data={chartData} timeframe="1D" />
          </div>
        )}

        {/* Positions */}
        {activeTab === "positions" && (
          <div className="bg-base-100 shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Positions</h3>
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>LTP</th>
                  <th>PNL</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.instrument}</td>
                    <td>{p.quantity}</td>
                    <td>₹{p.avg_price}</td>
                    <td>₹{p.ltp}</td>
                    <td
                      className={p.pnl >= 0 ? "text-success" : "text-error"}
                    >
                      {p.pnl >= 0 ? "+" : ""}
                      ₹{p.pnl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
