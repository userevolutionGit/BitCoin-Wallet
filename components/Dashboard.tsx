import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Copy, Send, QrCode, Check } from 'lucide-react';
import { WalletState, TransactionType, Network, TESTNET_ADDRESS, MAINNET_ADDRESS, AppView } from '../types';

interface DashboardProps {
  walletState: WalletState;
  network: Network;
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ walletState, network, onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const currentAddress = network === 'TESTNET' ? TESTNET_ADDRESS : MAINNET_ADDRESS;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    if (addr.length < 24) return addr;
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 10)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Balance Card */}
      <div className="bg-[#F7931A] rounded-[2rem] p-8 md:p-10 text-white text-center shadow-xl shadow-orange-900/20 relative overflow-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <p className="text-orange-100 font-medium text-lg mb-6">Total Balance</p>
          
          <div className="mb-2">
             <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
               ₿ {walletState.btcBalance.toFixed(8)}
             </h1>
          </div>
          
          <p className="text-orange-100/90 text-lg mb-8">
            ≈ ${walletState.fiatBalance.toLocaleString()} USD
          </p>

          {/* Address Box */}
          <button 
            onClick={handleCopy}
            className="group bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-xl px-5 py-3 mb-10 flex items-center space-x-3 transition-all duration-200"
          >
             <span className="font-mono text-white/90 text-sm md:text-base tracking-wide">
               {formatAddress(currentAddress)}
             </span>
             {copied ? <Check size={18} className="text-white" /> : <Copy size={18} className="text-white/70 group-hover:text-white" />}
          </button>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
             <button 
               onClick={() => onNavigate(AppView.SEND)}
               className="bg-white text-[#F7931A] hover:bg-orange-50 font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-black/5"
             >
               <Send size={20} className="transform -rotate-45 mb-1" />
               <span>Send</span>
             </button>
             <button 
               onClick={() => onNavigate(AppView.RECEIVE)}
               className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
             >
               <QrCode size={20} />
               <span>Receive</span>
             </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Header */}
      <div className="flex justify-between items-center px-2">
         <h3 className="text-xl font-semibold text-white">Recent Transactions</h3>
         <button className="text-[#F7931A] hover:text-orange-400 font-medium text-sm transition-colors">View All</button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
          {walletState.transactions.map((tx) => (
            <div key={tx.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  tx.type === TransactionType.RECEIVE 
                    ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20'
                }`}>
                  {tx.type === TransactionType.RECEIVE 
                    ? <ArrowDownLeft size={24} /> 
                    : <ArrowUpRight size={24} />
                  }
                </div>
                <div>
                  <p className="font-bold text-slate-200">
                    {tx.type === TransactionType.RECEIVE ? 'Received' : 'Sent'}
                  </p>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                     <span className="font-mono text-slate-400 mr-2">{formatAddress(tx.address)}</span>
                     <span>{tx.date}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${
                  tx.type === TransactionType.RECEIVE ? 'text-emerald-400' : 'text-slate-200'
                }`}>
                  {tx.type === TransactionType.RECEIVE ? '+' : '-'}{tx.amount.toFixed(8)} BTC
                </p>
                <p className="text-xs text-slate-500 mt-1">
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
  );
};

export default Dashboard;