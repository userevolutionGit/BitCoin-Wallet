import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, Wallet } from 'lucide-react';
import MarketChart from './MarketChart';
import { WalletState, TransactionType, TransactionStatus } from '../types';

interface DashboardProps {
  walletState: WalletState;
}

const Dashboard: React.FC<DashboardProps> = ({ walletState }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="bg-black/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
              Main Wallet
            </span>
          </div>
          <div>
            <p className="text-amber-100 text-sm font-medium mb-1">Total Balance</p>
            <h2 className="text-3xl font-bold tracking-tight">{walletState.btcBalance.toFixed(8)} BTC</h2>
            <p className="text-white/80 mt-1">≈ ${walletState.fiatBalance.toLocaleString()}</p>
          </div>
        </div>

        <MarketChart />
      </div>

      {/* Transactions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View All</button>
        </div>
        <div className="divide-y divide-slate-700/50">
          {walletState.transactions.map((tx) => (
            <div key={tx.id} className="p-4 hover:bg-slate-700/30 transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${
                  tx.type === TransactionType.RECEIVE 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {tx.type === TransactionType.RECEIVE ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-medium text-slate-200">
                    {tx.type === TransactionType.RECEIVE ? 'Received Bitcoin' : 'Sent Bitcoin'}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    {tx.date} • {tx.status}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  tx.type === TransactionType.RECEIVE ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {tx.type === TransactionType.RECEIVE ? '+' : '-'}{tx.amount} BTC
                </p>
                <p className="text-xs text-slate-500">
                  ${tx.fiatValue.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {walletState.transactions.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No recent transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;