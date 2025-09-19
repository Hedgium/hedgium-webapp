// pages/positions/index.tsx (All Positions Page with Cards)
"use client"
import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  strategyId: string;
  strategyName: string;
  type: 'long' | 'short';
  assetType: string;
}

interface StrategySummary {
  id: string;
  name: string;
  positionCount: number;
  totalPnl: number;
  pnlPercentage: number;
}

const AllPositionsPage: NextPage = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [strategies, setStrategies] = useState<StrategySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'strategies'>('positions');

  useEffect(() => {
    // Simulate API fetch
    const fetchPositions = async () => {
      try {
        // In a real app, this would be an API call
        const mockPositions: Position[] = [
          {
            id: '1',
            symbol: 'AAPL',
            quantity: 10,
            entryPrice: 150.25,
            currentPrice: 165.32,
            pnl: 150.70,
            pnlPercentage: 10.03,
            strategyId: 'strat-1',
            strategyName: 'Moving Average Crossover',
            type: 'long',
            assetType: 'Stock'
          },
          {
            id: '2',
            symbol: 'MSFT',
            quantity: 5,
            entryPrice: 310.50,
            currentPrice: 327.89,
            pnl: 86.95,
            pnlPercentage: 5.6,
            strategyId: 'strat-2',
            strategyName: 'RSI Reversion',
            type: 'long',
            assetType: 'Stock'
          },
          {
            id: '3',
            symbol: 'TSLA',
            quantity: 8,
            entryPrice: 210.75,
            currentPrice: 195.42,
            pnl: -122.64,
            pnlPercentage: -7.27,
            strategyId: 'strat-1',
            strategyName: 'Moving Average Crossover',
            type: 'long',
            assetType: 'Stock'
          },
          {
            id: '4',
            symbol: 'NVDA',
            quantity: 3,
            entryPrice: 435.60,
            currentPrice: 452.83,
            pnl: 51.69,
            pnlPercentage: 3.96,
            strategyId: 'strat-3',
            strategyName: 'Breakout Strategy',
            type: 'short',
            assetType: 'Stock'
          },
          {
            id: '5',
            symbol: 'BTC/USD',
            quantity: 0.5,
            entryPrice: 38500,
            currentPrice: 42150,
            pnl: 1825,
            pnlPercentage: 9.47,
            strategyId: 'strat-4',
            strategyName: 'Crypto Momentum',
            type: 'long',
            assetType: 'Crypto'
          },
          {
            id: '6',
            symbol: 'ES Futures',
            quantity: 2,
            entryPrice: 4550.25,
            currentPrice: 4495.75,
            pnl: -1085,
            pnlPercentage: -2.39,
            strategyId: 'strat-5',
            strategyName: 'Futures Trend',
            type: 'short',
            assetType: 'Futures'
          },
        ];
        setPositions(mockPositions);
        
        // Calculate strategy summaries
        const strategyMap = new Map();
        mockPositions.forEach(position => {
          if (!strategyMap.has(position.strategyId)) {
            strategyMap.set(position.strategyId, {
              id: position.strategyId,
              name: position.strategyName,
              positionCount: 0,
              totalPnl: 0,
              totalInvestment: 0
            });
          }
          const strategy = strategyMap.get(position.strategyId);
          strategy.positionCount += 1;
          strategy.totalPnl += position.pnl;
          strategy.totalInvestment += position.entryPrice * position.quantity;
        });
        
        const strategySummaries: StrategySummary[] = Array.from(strategyMap.values()).map(strategy => ({
          id: strategy.id,
          name: strategy.name,
          positionCount: strategy.positionCount,
          totalPnl: strategy.totalPnl,
          pnlPercentage: strategy.totalInvestment > 0 ? (strategy.totalPnl / strategy.totalInvestment) * 100 : 0
        }));
        
        setStrategies(strategySummaries);
      } catch (error) {
        console.error('Failed to fetch positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, []);

  // Calculate total PnL
  const totalPnl = positions.reduce((sum, position) => sum + position.pnl, 0);
  const totalInvestment = positions.reduce((sum, position) => sum + (position.entryPrice * position.quantity), 0);
  const totalPnlPercentage = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
            <div className="stat">
              <div className="stat-title">Total Positions</div>
              <div className="stat-value">{positions.length}</div>
              <div className="stat-desc">Across {strategies.length} strategies</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 p-1 mb-8">
          <a 
            className={`tab tab-lg ${activeTab === 'positions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('positions')}
          >
            Positions
          </a> 
          <a 
            className={`tab tab-lg ${activeTab === 'strategies' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('strategies')}
          >
            Strategies
          </a>
        </div>

        {/* Positions View */}
        {activeTab === 'positions' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">All Positions</h2>
            {positions.length === 0 ? (
              <div className="text-center py-12 bg-base-100 rounded-xl shadow">
                <div className="text-2xl text-gray-500 mb-4">No positions found</div>
                <p className="text-gray-400">{`You don't have any open positions across your strategies.`}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {positions.map((position) => (
                  <div key={position.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                    <div className="card-body">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="card-title text-2xl">{position.symbol}</h3>
                          <div className="badge badge-outline mt-1">{position.assetType}</div>
                        </div>
                        <div className={`badge ${position.type === 'long' ? 'badge-success' : 'badge-error'} badge-lg`}>
                          {position.type}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-gray-500 text-sm">Quantity</p>
                          <p className="font-semibold">{position.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Entry Price</p>
                          <p className="font-semibold">${position.entryPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Current Price</p>
                          <p className="font-semibold">${position.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">P&L %</p>
                          <p className={position.pnlPercentage >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm">Strategy</p>
                        <Link href={`/strategies/${position.strategyId}/positions`}>
                          <span className="font-semibold text-primary hover:underline cursor-pointer">
                            {position.strategyName}
                          </span>
                        </Link>
                      </div>
                      
                      <div className="card-actions justify-end mt-4">
                        <div className={`text-xl font-bold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Strategies View */}
        {activeTab === 'strategies' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Trading Strategies</h2>
            {strategies.length === 0 ? (
              <div className="text-center py-12 bg-base-100 rounded-xl shadow">
                <div className="text-2xl text-gray-500 mb-4">No strategies found</div>
                <p className="text-gray-400">{`You don't have any active trading strategies.`}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                    <div className="card-body">
                      <h3 className="card-title text-xl">{strategy.name}</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-gray-500 text-sm">Positions</p>
                          <p className="font-semibold text-2xl">{strategy.positionCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">P&L %</p>
                          <p className={strategy.pnlPercentage >= 0 ? 'text-green-600 font-semibold text-2xl' : 'text-red-600 font-semibold text-2xl'}>
                            {strategy.pnlPercentage >= 0 ? '+' : ''}{strategy.pnlPercentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm">Total Profit/Loss</p>
                        <p className={strategy.totalPnl >= 0 ? 'text-green-600 font-bold text-xl' : 'text-red-600 font-bold text-xl'}>
                          {strategy.totalPnl >= 0 ? '+' : ''}${strategy.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      <div className="card-actions justify-end mt-4">
                        <Link href={`/strategies/${strategy.id}/positions`}>
                          <button className="btn btn-primary">View Positions</button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllPositionsPage;