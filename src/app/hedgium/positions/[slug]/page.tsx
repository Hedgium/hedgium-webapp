// pages/strategies/[id]/positions.tsx (Single Strategy Positions Page)
"use client"
import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import Link from 'next/link';

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  type: 'long' | 'short';
}

interface Strategy {
  id: string;
  name: string;
  description: string;
}

const StrategyPositionsPage: NextPage = () => {
  const params = useParams();
  const { slug } = params;
  
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch based on strategy ID
    const fetchStrategyData = async () => {
      if (!slug) return;
      
      try {
        // In a real app, these would be API calls
        const mockStrategies: Record<string, Strategy> = {
          'strat-1': {
            id: 'strat-1',
            name: 'Moving Average Crossover',
            description: 'Buys when short MA crosses above long MA, sells when opposite occurs.'
          },
          'strat-2': {
            id: 'strat-2',
            name: 'RSI Reversion',
            description: 'Takes positions based on RSI overbought/oversold conditions.'
          },
          'strat-3': {
            id: 'strat-3',
            name: 'Breakout Strategy',
            description: 'Enters positions when price breaks through key resistance/support levels.'
          }
        };

        const mockPositions: Record<string, Position[]> = {
          'strat-1': [
            {
              id: '1',
              symbol: 'AAPL',
              quantity: 10,
              entryPrice: 150.25,
              currentPrice: 165.32,
              pnl: 150.70,
              pnlPercentage: 10.03,
              type: 'long'
            },
            {
              id: '3',
              symbol: 'TSLA',
              quantity: 8,
              entryPrice: 210.75,
              currentPrice: 195.42,
              pnl: -122.64,
              pnlPercentage: -7.27,
              type: 'long'
            }
          ],
          'strat-2': [
            {
              id: '2',
              symbol: 'MSFT',
              quantity: 5,
              entryPrice: 310.50,
              currentPrice: 327.89,
              pnl: 86.95,
              pnlPercentage: 5.6,
              type: 'long'
            }
          ],
          'strat-3': [
            {
              id: '4',
              symbol: 'NVDA',
              quantity: 3,
              entryPrice: 435.60,
              currentPrice: 452.83,
              pnl: 51.69,
              pnlPercentage: 3.96,
              type: 'short'
            }
          ]
        };

        setStrategy(mockStrategies[slug as string] || null);
        setPositions(mockPositions[slug as string] || []);
      } catch (error) {
        console.error('Failed to fetch strategy data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStrategyData();
  }, [slug]);

  // Calculate strategy PnL
  const strategyPnl = positions.reduce((sum, position) => sum + position.pnl, 0);
  const strategyPnlPercentage = positions.length > 0 
    ? (strategyPnl / positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.quantity), 0)) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Strategy Not Found</h1>
        <Link href="/hedgium/positions">
          <button className="btn btn-primary">Back to All Positions</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li><Link href="/hedgium/positions">All Positions</Link></li>
          <li>{strategy.name} Positions</li>
        </ul>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{strategy.name} Positions</h1>
          <p className="text-gray-600">{strategy.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">Strategy P&L: 
            <span className={strategyPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
              ${strategyPnl.toFixed(2)} ({strategyPnlPercentage.toFixed(2)}%)
            </span>
          </div>
          <div className="text-sm text-gray-500">{positions.length} open positions</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Entry Price</th>
              <th>Current Price</th>
              <th>Type</th>
              <th>P&L</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id}>
                <td className="font-bold">{position.symbol}</td>
                <td>{position.quantity}</td>
                <td>${position.entryPrice.toFixed(2)}</td>
                <td>${position.currentPrice.toFixed(2)}</td>
                <td>
                  <span className={`badge ${position.type === 'long' ? 'badge-success' : 'badge-error'}`}>
                    {position.type}
                  </span>
                </td>
                <td className={position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                  ${position.pnl.toFixed(2)} ({position.pnlPercentage.toFixed(2)}%)
                </td>
                <td>
                  <button className="btn btn-ghost btn-xs">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {positions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-2xl text-gray-500 mb-4">No positions found for this strategy</div>
          <p className="text-gray-400">{`This strategy doesn't have any open positions at the moment.`}</p>
        </div>
      )}
    </div>
  );
};

export default StrategyPositionsPage;