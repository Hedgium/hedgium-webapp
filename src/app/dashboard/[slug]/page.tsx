'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, LineChart, BarChart3, DollarSign, Calendar, 
  TrendingUp, TrendingDown, MoreVertical, Clock, CheckCircle,
  XCircle, PieChart, Download, Share2, Edit, Trash2
} from 'lucide-react';


// import TradingViewChart from '@/components/TradingViewChart';
// We'll use dynamic import for TradingView charts to avoid SSR issues
const TradingViewChart = dynamic(() => import('@/components/TradingViewChart'), { 
  ssr: false 
});

import dynamic from 'next/dynamic';

export default function StrategyDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [chartData, setChartData] = useState<{ time: string; value: number }[] | null>(null);
  const [timeframe, setTimeframe] = useState('1D');

  // Mock strategy data - in a real app, this would come from an API
  const strategy = {
    id: 1,
    name: "Bull Call Spread",
    symbol: "NIFTY",
    status: "running",
    return: 12.5,
    created: "2023-09-10",
    currentValue: 125000,
    investment: 110000,
    legs: [
      { 
        id: 1, 
        action: "BUY", 
        type: "CE", 
        strike: 19800, 
        quantity: 75, 
        entryPrice: 152, 
        currentPrice: 168, 
        pnl: 1200,
        pnlPercent: 10.5,
        filled: true 
      },
      { 
        id: 2, 
        action: "SELL", 
        type: "CE", 
        strike: 19900, 
        quantity: 75, 
        entryPrice: 112, 
        currentPrice: 98, 
        pnl: 1050,
        pnlPercent: 12.5,
        filled: true 
      }
    ],
    history: [
      { date: "2023-09-10", value: 110000 },
      { date: "2023-09-11", value: 112500 },
      { date: "2023-09-12", value: 115200 },
      { date: "2023-09-13", value: 117800 },
      { date: "2023-09-14", value: 119500 },
      { date: "2023-09-15", value: 121200 },
      { date: "2023-09-16", value: 123100 },
      { date: "2023-09-17", value: 124500 },
      { date: "2023-09-18", value: 125000 },
    ]
  };

  // Calculate total P&L
  const totalPnl = strategy.legs.reduce((sum, leg) => sum + leg.pnl, 0);
  const totalPnlPercent = ((strategy.currentValue - strategy.investment) / strategy.investment * 100).toFixed(2);

  // Mock chart data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate fetching chart data
    const mockChartData = [
      { time: '2023-09-10', value: 110000 },
      { time: '2023-09-11', value: 112500 },
      { time: '2023-09-12', value: 115200 },
      { time: '2023-09-13', value: 117800 },
      { time: '2023-09-14', value: 119500 },
      { time: '2023-09-15', value: 121200 },
      { time: '2023-09-16', value: 123100 },
      { time: '2023-09-17', value: 124500 },
      { time: '2023-09-18', value: 125000 },
    ];
    setChartData(mockChartData);
  }, [timeframe]);

  type Leg = {
    id: number;
    action: string;
    type: string;
    strike: number;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    filled: boolean;
  };

  const LegRow = ({ leg }: { leg: Leg }) => {
    const isProfit = leg.pnl >= 0;
    
    return (
      <tr>
        <td>
          <span className={`font-semibold ${leg.action === 'BUY' ? 'text-success' : 'text-error'}`}>
            {leg.action}
          </span>
        </td>
        <td>{leg.strike} {leg.type}</td>
        <td>{leg.quantity}</td>
        <td>₹{leg.entryPrice}</td>
        <td>₹{leg.currentPrice}</td>
        <td className={isProfit ? 'text-success' : 'text-error'}>
          {isProfit ? '+' : ''}₹{Math.abs(leg.pnl).toLocaleString()}
        </td>
        <td className={isProfit ? 'text-success' : 'text-error'}>
          {isProfit ? '+' : ''}{leg.pnlPercent}%
        </td>
        <td>
          {leg.filled ? (
            <CheckCircle size={16} className="text-success" />
          ) : (
            <Clock size={16} className="text-warning" />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="btn btn-ghost btn-circle mr-2"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Strategy Details</h1>
        </div>

        {/* Strategy header card */}
        <div className="card bg-base-100 shadow-md mb-8">
          <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="card-title text-2xl mb-2">{strategy.name}</h2>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="badge badge-lg badge-primary">{strategy.symbol}</span>
                  <span className={`badge badge-lg gap-1 ${strategy.status === 'running' ? 'badge-success' : 'badge-error'}`}>
                    {strategy.status === 'running' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {strategy.status}
                  </span>
                  <span className="text-gray-500">
                    <Calendar size={16} className="inline mr-1" />
                    Created: {strategy.created}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 text-right">
                <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-success' : 'text-error'}`}>
                  {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString()} 
                  ({totalPnlPercent}%)
                  {totalPnl >= 0 ? <TrendingUp size={20} className="inline ml-1" /> : <TrendingDown size={20} className="inline ml-1" />}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Current: ₹{strategy.currentValue.toLocaleString()} | 
                  Invested: ₹{strategy.investment.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="card-actions justify-end mt-6">
              <button className="btn btn-outline">
                <Share2 size={18} className="mr-2" />
                Share
              </button>
              <button className="btn btn-outline">
                <Download size={18} className="mr-2" />
                Export
              </button>
              <button className="btn btn-primary">
                <Edit size={18} className="mr-2" />
                Edit Strategy
              </button>
            </div>
          </div>
        </div>

        {/* Tabs for different views */}
        <div className="tabs tabs-boxed bg-base-100 p-1 mb-6">
          <a 
            className={`tab tab-lg ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={18} className="mr-2" />
            Overview
          </a> 
          <a 
            className={`tab tab-lg ${activeTab === 'performance' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <LineChart size={18} className="mr-2" />
            Performance
          </a>
          <a 
            className={`tab tab-lg ${activeTab === 'positions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('positions')}
          >
            <PieChart size={18} className="mr-2" />
            Positions
          </a>
        </div>

        {/* Timeframe selector */}
        <div className="flex justify-end mb-6">
          <div className="btn-group">
            {['1D', '1W', '1M', '3M', 'YTD', 'All'].map((period) => (
              <button
                key={period}
                className={`btn btn-sm ${timeframe === period ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTimeframe(period)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title mb-4">Performance Chart</h3>
                <div className="h-80">
                  {chartData && (
                    <TradingViewChart 
                      data={chartData} 
                      timeframe={timeframe}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title mb-4">Strategy Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-base-200 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Max Profit</div>
                      <div className="text-xl font-bold text-success">₹45,000</div>
                    </div>
                    <TrendingUp size={24} className="text-success" />
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-base-200 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Max Loss</div>
                      <div className="text-xl font-bold text-error">₹15,000</div>
                    </div>
                    <TrendingDown size={24} className="text-error" />
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-base-200 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Breakeven</div>
                      <div className="text-xl font-bold">19,850</div>
                    </div>
                    <DollarSign size={24} className="text-info" />
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-base-200 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Days to Expiry</div>
                      <div className="text-xl font-bold">12</div>
                    </div>
                    <Calendar size={24} className="text-warning" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title mb-4">Performance Analysis</h3>
              <div className="h-96">
                {chartData && (
                  <TradingViewChart 
                    data={chartData} 
                    timeframe={timeframe}
                    type="advanced"
                  />
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="stats bg-primary text-primary-content">
                  <div className="stat">
                    <div className="stat-title">Best Day</div>
                    <div className="stat-value">+₹4,200</div>
                    <div className="stat-desc">Sep 12, 2023</div>
                  </div>
                </div>
                
                <div className="stats bg-secondary text-secondary-content">
                  <div className="stat">
                    <div className="stat-title">Worst Day</div>
                    <div className="stat-value">-₹1,800</div>
                    <div className="stat-desc">Sep 15, 2023</div>
                  </div>
                </div>
                
                <div className="stats bg-accent text-accent-content">
                  <div className="stat">
                    <div className="stat-title">Avg Daily Return</div>
                    <div className="stat-value">+₹1,875</div>
                    <div className="stat-desc">8 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title mb-4">Strategy Positions</h3>
              
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Strike & Type</th>
                      <th>Quantity</th>
                      <th>Entry Price</th>
                      <th>Current Price</th>
                      <th>P&L</th>
                      <th>P&L %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.legs.map(leg => (
                      <LegRow key={leg.id} leg={leg} />
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="divider"></div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Total Strategy P&L</h4>
                  <p className={`text-2xl ${totalPnl >= 0 ? 'text-success' : 'text-error'}`}>
                    {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString()} 
                    ({totalPnlPercent}%)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button className="btn btn-outline btn-error">
                    <Trash2 size={18} className="mr-2" />
                    Close All Positions
                  </button>
                  <button className="btn btn-primary">
                    <Edit size={18} className="mr-2" />
                    Adjust Strategy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="card bg-base-100 shadow-md mt-8">
          <div className="card-body">
            <h3 className="card-title mb-4">Recent Activity</h3>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2023-09-10 10:15:23</td>
                    <td>BUY</td>
                    <td>NIFTY 19800 CE Qty: 75</td>
                    <td>₹152</td>
                    <td><span className="badge badge-success badge-sm">Filled</span></td>
                  </tr>
                  <tr>
                    <td>2023-09-10 10:16:05</td>
                    <td>SELL</td>
                    <td>NIFTY 19900 CE Qty: 75</td>
                    <td>₹112</td>
                    <td><span className="badge badge-success badge-sm">Filled</span></td>
                  </tr>
                  <tr>
                    <td>2023-09-15 14:30:18</td>
                    <td>Adjust</td>
                    <td>Rolled 19900 CE to 20000 CE</td>
                    <td>Credit ₹8</td>
                    <td><span className="badge badge-success badge-sm">Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}