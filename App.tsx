import React, { useState } from 'react';
import { LayoutDashboard, Send, Download, Bot, LogOut, Bitcoin, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SendForm from './components/SendForm';
import GeminiAdvisor from './components/GeminiAdvisor';
import { AppView, WalletState, TransactionType, TransactionStatus } from './types';

const INITIAL_WALLET_STATE: WalletState = {
  btcBalance: 1.24503211,
  fiatBalance: 78540.23,
  transactions: [
    {
      id: 'tx1',
      type: TransactionType.RECEIVE,
      amount: 0.15,
      fiatValue: 9450,
      date: '2 hours ago',
      address: 'bc1q...x9p2',
      status: TransactionStatus.COMPLETED
    },
    {
      id: 'tx2',
      type: TransactionType.SEND,
      amount: 0.02,
      fiatValue: 1260,
      date: 'Yesterday',
      address: '3J98...kL2m',
      status: TransactionStatus.COMPLETED
    },
    {
      id: 'tx3',
      type: TransactionType.RECEIVE,
      amount: 0.5,
      fiatValue: 31500,
      date: '3 days ago',
      address: 'bc1q...m4k9',
      status: TransactionStatus.COMPLETED
    }
  ]
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [walletState] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-amber-500 text-slate-900 font-semibold shadow-lg shadow-amber-500/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-950 border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bitcoin className="text-slate-900 font-bold" size={24} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Zenith<span className="text-amber-500">Wallet</span></h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={AppView.SEND} icon={Send} label="Send" />
          <NavItem view={AppView.RECEIVE} icon={Download} label="Receive" />
          <NavItem view={AppView.ADVISOR} icon={Bot} label="AI Advisor" />
        </nav>

        <div className="p-4 m-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-500 mb-2">Current BTC Price</p>
          <p className="text-lg font-bold text-white">$64,520.10</p>
          <span className="text-xs text-emerald-400 font-medium">+2.4% today</span>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className={`fixed inset-0 z-50 bg-slate-950 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 lg:hidden flex flex-col`}>
         <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Bitcoin className="text-slate-900" size={20} />
            </div>
            <h1 className="text-lg font-bold text-white">Zenith</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={AppView.SEND} icon={Send} label="Send" />
          <NavItem view={AppView.RECEIVE} icon={Download} label="Receive" />
          <NavItem view={AppView.ADVISOR} icon={Bot} label="AI Advisor" />
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-white capitalize">
              {currentView === AppView.ADVISOR ? 'Zenith AI Advisor' : currentView.toLowerCase()}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Mainnet</span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-full cursor-pointer hover:ring-2 ring-offset-2 ring-offset-slate-900 ring-amber-500 transition-all"></div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === AppView.DASHBOARD && <Dashboard walletState={walletState} />}
            {currentView === AppView.SEND && <SendForm />}
            {currentView === AppView.ADVISOR && <GeminiAdvisor />}
            {currentView === AppView.RECEIVE && (
              <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Receive Bitcoin</h2>
                  <p className="text-slate-400">Scan the QR code or copy the address below</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-white/5">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`} 
                    alt="Wallet QR Code" 
                    className="w-64 h-64 mix-blend-multiply"
                  />
                </div>

                <div className="w-full max-w-md bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                  <code className="text-amber-500 font-mono text-sm truncate mr-4">
                    bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                  </code>
                  <button className="text-slate-400 hover:text-white transition-colors" title="Copy">
                    <Download size={20} className="transform rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;