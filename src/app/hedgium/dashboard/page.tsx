
'use client';

import React, { useState, useEffect } from 'react';


import { Icon } from '@iconify/react';

// import Link from 'next/link';
import Slider from '@/components/Slider';

import TradeCycleCard from "@/components/TradeCycleCard";
import MarketHeader from '@/components/MarketHeader';
import DashboardMetrics from '@/components/DashboardMetrics';

// import { useAuthStore } from '@/store/authStore';

import { authFetch } from '@/utils/api';

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

interface TradeCycle {
  id: number;
  name: string;
  description?: string;
  state: string;
  sub_state: string;
  created_at: string;
  // add other fields you actually return from the API
}


interface DashboardStats {
  totalReturn: number;
  activeStrategies: number;
  successRate: number;
  weeklyGain: number;
}



export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [activeTradeCycles, setActiveTradeCycles] = useState([]);
  const [nextActiveTradeCycles, setNextActiveTradeCycles] = useState<string | null> (null);
  const [pastTradeCycles, setPastTradeCycles] = useState([])
  const [nextPastTradeCycles, setNextPastTradeCycles] = useState<string | null> (null);



    async function getActiveTradeCycles() {
      // console.log("Hello Bhai")
  
     try {

      const res = await authFetch('trade-cycles/?page=1&page_size=10')
      
      if (res.ok) {
        const data = await res.json();
        console.log(data.results);
        setActiveTradeCycles(data.results);
        setNextActiveTradeCycles(data.next);
      } else {
      }
    } catch {
    }
    }
  

    async function getPastTradeCycles() {
      // console.log("Hello Bhai")
  
     try {

      const res = await authFetch('trade-cycles/?page=1&page_size=10')
      
      if (res.ok) {
        const data = await res.json();
        setPastTradeCycles(data.results);
        setNextPastTradeCycles(data.next);
      } else {
      }
    } catch {
    }
    }

    useEffect(()=>{
        getActiveTradeCycles();
        getPastTradeCycles();
    },[])

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


  return (
    <div className="bg-base-200 hero-pattern p-4 md:p-6">

      <MarketHeader />

      <DashboardMetrics />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
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
        </div> */}
  
  
        
        {/* Tabs for Active/Past Strategies */}
        <div className="tabs tabs-boxed bg-base-100 p-1 mb-6">
          <button 
            className={`tab tab-lg ${activeTab === 'active' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Cards
            {/* <span className="badge badge-sm badge-primary ml-2">
              {strategyData.active.length}
            </span> */}
          </button> 
          <button 
            className={`tab tab-lg ${activeTab === 'past' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Other Cards
            {/* <span className="badge badge-sm badge-neutral ml-2">
              {strategyData.past.length}
            </span> */}
          </button>
        </div>
        
        {/* Search and Filter Bar */}
        {/* <div className="flex flex-col md:flex-row gap-4 mb-6">
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
        </div> */}
        
        {/* Strategy Cards */}
        
        <div className="mb-8">
  {activeTab === "active" ? (
    activeTradeCycles.length > 0 ? <>
    <Slider>
      {activeTradeCycles.map((tc) => (
        <TradeCycleCard key={tc?.id} tradeCycle={tc} isActive={true} />
      ))}
    </Slider>
    </> : (
      <div className="text-center py-12 bg-base-100 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-2">No Active Trade Cycles</h3>
        <p className="text-gray-600">{`You don't have any active trade cycles at the moment.`}</p>
      </div>
    )
  ) : pastTradeCycles.length > 0 ? (
    <Slider>
    {pastTradeCycles.map((tc) => (
      <TradeCycleCard key={tc?.id} tradeCycle={tc} isActive={false} />
    ))}
    </Slider>
  ) : (
    <div className="text-center py-12 bg-base-100 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-2">No Past Trade Cycles</h3>
      <p className="text-gray-600">{`You don't have any past trade cycles yet.`}</p>
    </div>
  )}
</div>

        {/* Performance Chart Section */}
        <div className="card bg-base-100 shadow-md mb-8">
          <div className="card-body">
            <h2 className="card-title mb-6">Performance Overview</h2>
            <div className="h-80 bg-base-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Icon icon="lucide:line-chart" width={48} className="mx-auto text-gray-400 mb-4" />
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
