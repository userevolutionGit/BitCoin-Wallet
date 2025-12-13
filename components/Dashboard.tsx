import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Copy, Send, QrCode, Check, Filter, X, ChevronDown, ChevronUp, Hash, Activity, Clock, ExternalLink } from 'lucide-react';
import { WalletState, TransactionType, TransactionStatus, Network, TESTNET_ADDRESS, MAINNET_ADDRESS, AppView } from '../types';

interface DashboardProps {
  walletState: WalletState;
  network: Network;
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ walletState, network, onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const filteredTransactions = walletState.transactions.filter(tx => {
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const FilterPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
        active 
          ? 'bg-amber-500 text-slate-900 border-amber-500' 
          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );

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
            ≈ ${walletState.fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
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

      {/* Recent Transactions Header & Filters */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center space-x-4">
             <h3 className="text-xl font-semibold text-white">Recent Transactions</h3>
             <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                showFilters || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'bg-slate-800 text-amber-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
               <Filter size={18} />
               {(typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                 <span className="text-xs font-bold bg-amber-500 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center">!</span>
               )}
             </button>
           </div>
           {(typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
             <button 
               onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); }}
               className="text-xs text-slate-500 hover:text-white flex items-center space-x-1"
             >
               <X size={12} />
               <span>Clear Filters</span>
             </button>
           )}
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Type</span>
              <div className="flex flex-wrap gap-2">
                <FilterPill label="All" active={typeFilter === 'ALL'} onClick={() => setTypeFilter('ALL')} />
                <FilterPill label="Sent" active={typeFilter === TransactionType.SEND} onClick={() => setTypeFilter(TransactionType.SEND)} />
                <FilterPill label="Received" active={typeFilter === TransactionType.RECEIVE} onClick={() => setTypeFilter(TransactionType.RECEIVE)} />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</span>
              <div className="flex flex-wrap gap-2">
                <FilterPill label="All" active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
                <FilterPill label="Completed" active={statusFilter === TransactionStatus.COMPLETED} onClick={() => setStatusFilter(TransactionStatus.COMPLETED)} />
                <FilterPill label="Pending" active={statusFilter === TransactionStatus.PENDING} onClick={() => setStatusFilter(TransactionStatus.PENDING)} />
                <FilterPill label="Failed" active={statusFilter === TransactionStatus.FAILED} onClick={() => setStatusFilter(TransactionStatus.FAILED)} />
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
            {filteredTransactions.map((tx) => {
              // Construct a realistic looking hash from the ID
              const fullTxId = `8a9f3d7c5b6e2f1a9d4c8b3e5a7d9c1f2e4b6a8d0c2e4f6a8b1d3c5e7f9a2b1c${tx.id}`;
              const explorerUrl = network === 'TESTNET' 
                ? `https://mempool.space/testnet4/tx/${fullTxId}` 
                : `https://mempool.space/tx/${fullTxId}`;

              return (
              <div key={tx.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-600">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(tx.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      tx.type === TransactionType.RECEIVE 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {tx.type === TransactionType.RECEIVE 
                        ? <ArrowDownLeft size={24} /> 
                        : <ArrowUpRight size={24} />
                      }
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-slate-200">
                          {tx.type === TransactionType.RECEIVE ? 'Received' : 'Sent'}
                        </p>
                        {tx.status !== TransactionStatus.COMPLETED && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            tx.status === TransactionStatus.PENDING ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {tx.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                         <span className="font-mono text-slate-400 mr-2">{formatAddress(tx.address)}</span>
                         <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className={`font-bold ${
                        tx.type === TransactionType.RECEIVE ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {tx.type === TransactionType.RECEIVE ? '+' : '-'}{tx.amount.toFixed(8)} BTC
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ${tx.fiatValue.toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(tx.id);
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
                      title="View Details"
                    >
                      <span className="text-xs font-medium hidden md:block">Details</span>
                      {expandedTxId === tx.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTxId === tx.id && (
                  <div className="bg-slate-900/50 border-t border-slate-700/50 p-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-3">
                         <div className="flex items-start space-x-3">
                            <Hash size={16} className="text-slate-500 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-0.5">Transaction ID</p>
                                <p className="text-xs font-mono text-slate-300 break-all leading-relaxed">
                                  {fullTxId}
                                </p>
                            </div>
                         </div>
                         <div className="flex items-start space-x-3">
                            <Activity size={16} className="text-slate-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Confirmations</p>
                                <p className="text-xs text-slate-300">
                                  {tx.status === TransactionStatus.COMPLETED ? '6+ Confirmations' : '0 Confirmations (Unconfirmed)'}
                                </p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-start space-x-3">
                            <Clock size={16} className="text-slate-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Time</p>
                                <p className="text-xs text-slate-300">{tx.date} • 14:30 PM</p>
                            </div>
                         </div>
                         <div className="flex items-start space-x-3">
                            <div className="w-4 h-4 flex items-center justify-center text-slate-500 font-bold text-xs">$</div>
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Network Fee</p>
                                <p className="text-xs text-slate-300">0.00001500 BTC</p>
                            </div>
                         </div>
                      </div>

                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                       <a 
                         href={explorerUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-xs text-amber-500 hover:text-amber-400 flex items-center space-x-1 transition-colors"
                       >
                         <span>View on Blockchain Explorer</span>
                         <ExternalLink size={12} />
                       </a>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
            {filteredTransactions.length === 0 && (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-500 mb-2">No transactions found matching your filters.</p>
                <button 
                  onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                  className="text-amber-500 hover:text-amber-400 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;