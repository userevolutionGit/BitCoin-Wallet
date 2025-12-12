import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Send, Download, Bot, LogOut, Bitcoin, Menu, X, Terminal, CheckCircle2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SendForm from './components/SendForm';
import GeminiAdvisor from './components/GeminiAdvisor';
import Console from './components/Console';
import { AppView, WalletState, TransactionType, TransactionStatus, TESTNET_ADDRESS, MAINNET_ADDRESS, Network } from './types';

const INITIAL_WALLET_STATE: WalletState = {
  btcBalance: 0.05234891,
  fiatBalance: 0, // Calculated dynamically
  transactions: [
    {
      id: 'tx1',
      type: TransactionType.RECEIVE,
      amount: 0.00125000,
      fiatValue: 82.50,
      date: 'Dec 10, 2025',
      address: TESTNET_ADDRESS,
      status: TransactionStatus.COMPLETED
    },
    {
      id: 'tx2',
      type: TransactionType.SEND,
      amount: 0.00050000,
      fiatValue: 33.00,
      date: 'Dec 8, 2025',
      address: TESTNET_ADDRESS,
      status: TransactionStatus.COMPLETED
    },
    {
      id: 'tx3',
      type: TransactionType.RECEIVE,
      amount: 0.05000000,
      fiatValue: 3300.00,
      date: 'Dec 5, 2025',
      address: TESTNET_ADDRESS,
      status: TransactionStatus.COMPLETED
    }
  ]
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [walletState] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [network, setNetwork] = useState<Network>('TESTNET');
  const [btcPrice, setBtcPrice] = useState<number>(0);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
        const data = await response.json();
        if (data?.bpi?.USD?.rate_float) {
          setBtcPrice(data.bpi.USD.rate_float);
        }
      } catch (error) {
        console.error('Failed to fetch Bitcoin price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const currentAddress = network === 'TESTNET' ? TESTNET_ADDRESS : MAINNET_ADDRESS;

  // Calculate dynamic fiat balance based on current BTC price
  const displayedWalletState = {
    ...walletState,
    fiatBalance: walletState.btcBalance * btcPrice
  };

  const toggleNetwork = () => {
    setNetwork(prev => prev === 'MAINNET' ? 'TESTNET' : 'MAINNET');
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

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
          <NavItem view={AppView.CLI} icon={Terminal} label="Bitcoin CLI" />
        </nav>

        <div className="p-4 m-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-500 mb-2">Current BTC Price</p>
          <p className="text-lg font-bold text-white">
            {btcPrice ? `$${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
          </p>
          <span className="text-xs text-emerald-400 font-medium">Live from CoinDesk</span>
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
          <NavItem view={AppView.CLI} icon={Terminal} label="Bitcoin CLI" />
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
              {currentView === AppView.ADVISOR ? 'Zenith AI Advisor' : 
               currentView === AppView.CLI ? 'Bitcoin Core Console' : 
               currentView.toLowerCase()}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleNetwork}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all border ${
                network === 'MAINNET' 
                  ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-900/40' 
                  : 'bg-amber-950/30 border-amber-500/50 hover:bg-amber-900/40'
              }`}
            >
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                network === 'MAINNET' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></div>
              <span className={`text-xs font-medium ${
                network === 'MAINNET' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {network === 'MAINNET' ? 'Mainnet' : 'Testnet'}
              </span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-full cursor-pointer hover:ring-2 ring-offset-2 ring-offset-slate-900 ring-amber-500 transition-all"></div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === AppView.DASHBOARD && (
              <Dashboard 
                walletState={displayedWalletState} 
                network={network} 
                onNavigate={handleNavigate} 
              />
            )}
            {currentView === AppView.SEND && <SendForm network={network} />}
            {currentView === AppView.ADVISOR && <GeminiAdvisor />}
            {currentView === AppView.CLI && <Console network={network} />}
            {currentView === AppView.RECEIVE && (
              <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Receive Bitcoin <span className="text-lg text-slate-500 align-top">({network})</span></h2>
                  <p className="text-slate-400">Scan the QR code or copy the address below</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-white/5">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${currentAddress}`} 
                    alt="Wallet QR Code" 
                    className="w-64 h-64 mix-blend-multiply"
                  />
                </div>

                <div className="w-full max-w-2xl bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                  <code className="text-amber-500 font-mono text-sm truncate mr-4">
                    {currentAddress}
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