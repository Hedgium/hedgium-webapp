'use client';

import React, { useState, useEffect } from 'react';
import Slider from '@/components/Slider';
import TradeCycleCard from "@/components/TradeCycleCard";
import MarketHeader from '@/components/MarketHeader';
import DashboardMetrics from '@/components/DashboardMetrics';
import { authFetch } from '@/utils/api';

export default function Dashboard() {
  const [activeTradeCycles, setActiveTradeCycles] = useState([]);
  const [nextActiveTradeCycles, setNextActiveTradeCycles] = useState<string | null>(null);

  async function getActiveTradeCycles() {
    try {
      const res = await authFetch('trade-cycles/?approved=true&page=1&page_size=10');
      
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

  useEffect(() => {
    getActiveTradeCycles();
  }, []);

  return (
    <div className="bg-base-200 p-4 md:p-6">
      <MarketHeader />
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
          {activeTradeCycles.length > 0 ? (
            <>
              <Slider>
                {activeTradeCycles.map((tc) => (
                  <TradeCycleCard key={tc?.id} tradeCycle={tc} isActive={true} />
                ))}
              </Slider>
            </>
          ) : (
            <div className="text-center py-12 bg-base-100 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">No Active Trade Cycles</h3>
              <p className="text-gray-600">{`You don't have any active trade cycles at the moment.`}</p>
            </div>
          )}
        </div>

        {/* Performance Chart Section */}
        {/* <div className="card bg-base-100 shadow-md mb-8">
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
        </div> */}
      </div>
    </div>
  );
}