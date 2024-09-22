"use client"

import React, {
  useEffect,
  useState,
} from 'react';

import { Trade } from '@/types';

import TradeCard from './TradeCard';

export default function TradeDashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch('/api/trades');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        setTrades(data);
        setFilteredTrades(data);
      } catch (error) {
        console.error('Error fetching trades:', error);
      }
    };

    fetchTrades();
  }, []);

  useEffect(() => {
    if (filter === 'All') {
      setFilteredTrades(trades);
    } else {
      const filtered = trades.filter((trade) => {
        if (filter === 'Buys') return trade.action.includes('BUY');
        if (filter === 'Sells') return trade.action.includes('SELL');
        if (filter === 'Transfers') return trade.action.includes('TRANSFER');
        if (filter === 'Swaps') return trade.action.includes('SWAP');
        return true;
      });
      setFilteredTrades(filtered);
    }
  }, [filter, trades]);

  return (
    <div className="bg-gray-900 text-white p-4 space-y-4">
      <h1 className="text-3xl font-bold mb-4">Trade Feed</h1>
      <div className="flex space-x-4 mb-4">
        {['All', 'Buys', 'Sells', 'Transfers', 'Swaps'].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded ${
              filter === type ? 'bg-purple-600' : 'bg-gray-700'
            }`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>
      {filteredTrades.map((trade, index) => (
        <TradeCard
          key={index}
          trade={trade}
          onCopyClick={() => {}}
          copySuccess=""
        />
      ))}
    </div>
  );
}