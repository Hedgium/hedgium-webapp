'use client';

import React, { useState } from 'react';
import { 
  LineChart, BarChart3, TrendingUp, TrendingDown, 
  MoreVertical, Calendar, DollarSign, PieChart,
  Filter, Search, Plus, Clock, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp
} from 'lucide-react';

// Define the types for the data structures
type StrategyStatus = 'running' | 'pending' | 'completed' | 'stopped';
type StrategyAction = 'BUY' | 'SELL';
type OptionType = 'CE' | 'PE';

interface StrategyLeg {
  action: StrategyAction;
  type: OptionType;
  strike: number;
  quantity: number;
  premium: number;
  filled: boolean;
}

interface Strategy {
  id: number;
  name: string;
  symbol: string;
  status: StrategyStatus;
  return: number;
  created: string;
  closed?: string; // Optional field for past strategies
  legs: StrategyLeg[];
}

interface StrategyData {
  active: Strategy[];
  past: Strategy[];
}

interface DashboardStats {
  totalReturn: number;
  activeStrategies: number;
  successRate: number;
  weeklyGain: number;
}

// Props interface for the StrategyCard component
interface StrategyCardProps {
  strategy: Strategy;
  isActive: boolean;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const toggleCardExpansion = (id: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Sample data for strategy cards
  const strategyData: StrategyData = {
    active: [
      {
        id: 1,
        name: "Bull Call Spread",
        symbol: "NIFTY",
        status: "running",
        return: 12.5,
        created: "2023-09-10",
        legs: [
          { action: "BUY", type: "CE", strike: 19800, quantity: 75, premium: 152, filled: true },
          { action: "SELL", type: "CE", strike: 19900, quantity: 75, premium: 112, filled: true }
        ]
      },
      {
        id: 2,
        name: "Iron Condor",
        symbol: "BANKNIFTY",
        status: "running",
        return: 8.2,
        created: "2023-09-15",
        legs: [
          { action: "SELL", type: "PE", strike: 44000, quantity: 50, premium: 205, filled: true },
          { action: "BUY", type: "PE", strike: 43800, quantity: 50, premium: 180, filled: true },
          { action: "SELL", type: "CE", strike: 44200, quantity: 50, premium: 190, filled: true },
          { action: "BUY", type: "CE", strike: 44400, quantity: 50, premium: 165, filled: true }
        ]
      },
      {
        id: 3,
        name: "Long Straddle",
        symbol: "RELIANCE",
        status: "pending",
        return: 0,
        created: "2023-09-20",
        legs: [
          { action: "BUY", type: "CE", strike: 2450, quantity: 100, premium: 32, filled: false },
          { action: "BUY", type: "PE", strike: 2450, quantity: 100, premium: 28, filled: false }
        ]
      }
    ],
    past: [
      {
        id: 4,
        name: "Bear Put Spread",
        symbol: "NIFTY",
        status: "completed",
        return: 15.3,
        created: "2023-08-25",
        closed: "2023-09-05",
        legs: [
          { action: "BUY", type: "PE", strike: 19200, quantity: 75, premium: 145, filled: true },
          { action: "SELL", type: "PE", strike: 19100, quantity: 75, premium: 120, filled: true }
        ]
      },
      {
        id: 5,
        name: "Credit Spread",
        symbol: "BANKNIFTY",
        status: "stopped",
        return: -5.7,
        created: "2023-08-20",
        closed: "2023-08-28",
        legs: [
          { action: "SELL", type: "CE", strike: 43500, quantity: 50, premium: 225, filled: true },
          { action: "BUY", type: "CE", strike: 43700, quantity: 50, premium: 195, filled: true }
        ]
      }
    ]
  };

  const stats: DashboardStats = {
    totalReturn: 18.4,
    activeStrategies: 3,
    successRate: 76.8,
    weeklyGain: 2.3
  };

  const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, isActive }) => {
    const isExpanded = expandedCards[strategy.id];
    const isProfit = strategy.return > 0;
    
    return (
      <div className="card bg-base-100 shadow-md mb-6 border-l-4 border-l-primary">
        <div className="card-body p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="card-title text-lg">{strategy.name}</h3>
              <div className="flex items-center mt-1">
                <span className="text-sm font-medium bg-base-200 px-2 py-1 rounded-md mr-2">
                  {strategy.symbol}
                </span>
                <span className={`badge ${isActive ? 
                  (strategy.status === 'running' ? 'badge-success' : 'badge-warning') : 
                  (strategy.status === 'completed' ? 'badge-info' : 'badge-error')
                } gap-1`}>
                  {strategy.status === 'running' && <CheckCircle size={14} />}
                  {strategy.status === 'pending' && <Clock size={14} />}
                  {strategy.status === 'completed' && <CheckCircle size={14} />}
                  {strategy.status === 'stopped' && <XCircle size={14} />}
                  {strategy.status}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-bold ${isProfit ? 'text-success' : 'text-error'}`}>
                {isProfit ? '+' : ''}{strategy.return}%
                {isProfit ? <ArrowUpRight size={18} className="inline ml-1" /> : <ArrowDownRight size={18} className="inline ml-1" />}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Created: {strategy.created}
                {!isActive && strategy.closed && ` | Closed: ${strategy.closed}`}
              </div>
            </div>
          </div>
          
          {/* Strategy legs summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {strategy.legs.slice(0, 4).map((leg, index) => (
              <div key={index} className="bg-base-200 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${leg.action === 'BUY' ? 'text-success' : 'text-error'}`}>
                    {leg.action}
                  </span>
                  {leg.filled ? (
                    <CheckCircle size={14} className="text-success" />
                  ) : (
                    <Clock size={14} className="text-warning" />
                  )}
                </div>
                <div className="text-sm mt-1">
                  {leg.strike} {leg.type}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Qty: {leg.quantity} | ₹{leg.premium}
                </div>
              </div>
            ))}
          </div>
          
          {/* Expand button for strategies with more than 4 legs */}
          {strategy.legs.length > 4 && (
            <button 
              className="btn btn-ghost btn-sm self-start mb-4"
              onClick={() => toggleCardExpansion(strategy.id)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} className="mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={16} className="mr-1" />
                  Show All {strategy.legs.length} Legs
                </>
              )}
            </button>
          )}
          
          {/* Expanded legs view */}
          {isExpanded && strategy.legs.length > 4 && (
            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-3">All Strategy Legs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {strategy.legs.map((leg, index) => (
                  <div key={index} className="bg-base-100 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${leg.action === 'BUY' ? 'text-success' : 'text-error'}`}>
                        {leg.action} {leg.type}
                      </span>
                      {leg.filled ? (
                        <CheckCircle size={14} className="text-success" />
                      ) : (
                        <Clock size={14} className="text-warning" />
                      )}
                    </div>
                    <div className="text-sm mt-2">
                      Strike: {leg.strike}
                    </div>
                    <div className="text-sm mt-1">
                      Quantity: {leg.quantity}
                    </div>
                    <div className="text-sm mt-1">
                      Premium: ₹{leg.premium}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="card-actions justify-end">
            {isActive ? (
              <>
                <button className="btn btn-outline btn-error btn-sm">
                  Close Strategy
                </button>
                <button className="btn btn-primary btn-sm">
                  Modify
                </button>
              </>
            ) : (
              <button className="btn btn-outline btn-sm">
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Trading Dashboard</h1>
            <p className="text-gray-600">Welcome back, here are your current strategies</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button className="btn btn-outline">
              <Filter size={18} className="mr-2" />
              Filter
            </button>
            <button className="btn btn-primary">
              <Plus size={18} className="mr-2" />
              New Strategy
            </button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-figure text-primary">
                <TrendingUp size={32} />
              </div>
              <div className="stat-title">Total Return</div>
              <div className="stat-value text-primary">{stats.totalReturn}%</div>
              <div className="stat-desc">Since joining</div>
            </div>
          </div>
          
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <BarChart3 size={32} />
              </div>
              <div className="stat-title">Active Strategies</div>
              <div className="stat-value text-secondary">{stats.activeStrategies}</div>
              <div className="stat-desc">3 running, 0 pending</div>
            </div>
          </div>
          
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-figure text-accent">
                <PieChart size={32} />
              </div>
              <div className="stat-title">Success Rate</div>
              <div className="stat-value text-accent">{stats.successRate}%</div>
              <div className="stat-desc">Profitable strategies</div>
            </div>
          </div>
          
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-figure text-info">
                <DollarSign size={32} />
              </div>
              <div className="stat-title">Weekly Gain</div>
              <div className="stat-value text-info">+{stats.weeklyGain}%</div>
              <div className="stat-desc">↗︎ +₹12,450 this week</div>
            </div>
          </div>
        </div>
        
        {/* Tabs for Active/Past Strategies */}
        <div className="tabs tabs-boxed bg-base-100 p-1 mb-6">
          <a 
            className={`tab tab-lg ${activeTab === 'active' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Strategies
            <span className="badge badge-sm badge-primary ml-2">
              {strategyData.active.length}
            </span>
          </a> 
          <a 
            className={`tab tab-lg ${activeTab === 'past' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Strategies
            <span className="badge badge-sm badge-neutral ml-2">
              {strategyData.past.length}
            </span>
          </a>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 z-10 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search strategies..." 
              className="input input-bordered pl-10 w-full"
            />
          </div>
          <select value={""} onChange={()=>{}} className="select select-bordered w-full md:w-auto">
            <option disabled>Sort by</option>
            <option>Recent</option>
            <option>Return: High to Low</option>
            <option>Return: Low to High</option>
            <option>Name A-Z</option>
          </select>
        </div>
        
        {/* Strategy Cards */}
        <div className="mb-8">
          {activeTab === 'active' ? (
            strategyData.active.length > 0 ? (
              strategyData.active.map(strategy => (
                <StrategyCard key={strategy.id} strategy={strategy} isActive={true} />
              ))
            ) : (
              <div className="text-center py-12 bg-base-100 rounded-lg shadow">
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Strategies</h3>
                <p className="text-gray-600 mb-4">You don't have any active trading strategies at the moment.</p>
                <button className="btn btn-primary">
                  <Plus size={18} className="mr-2" />
                  Create New Strategy
                </button>
              </div>
            )
          ) : (
            strategyData.past.length > 0 ? (
              strategyData.past.map(strategy => (
                <StrategyCard key={strategy.id} strategy={strategy} isActive={false} />
              ))
            ) : (
              <div className="text-center py-12 bg-base-100 rounded-lg shadow">
                <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Past Strategies</h3>
                <p className="text-gray-600">You don't have any past trading strategies yet.</p>
              </div>
            )
          )}
        </div>
        
        {/* Performance Chart Section */}
        <div className="card bg-base-100 shadow-md mb-8">
          <div className="card-body">
            <h2 className="card-title mb-6">Performance Overview</h2>
            <div className="h-80 bg-base-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <LineChart size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Performance chart will be displayed here</p>
                <p className="text-sm text-gray-500">Connect your trading account to see detailed analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
