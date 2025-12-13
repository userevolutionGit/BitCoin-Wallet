import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Send, Download, Bot, LogOut, Bitcoin, Menu, X, Terminal, CheckCircle2, KeyRound, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SendForm from './components/SendForm';
import GeminiAdvisor from './components/GeminiAdvisor';
import Console from './components/Console';
import ImportWalletModal from './components/ImportWalletModal';
import Airdrop from './components/Airdrop';
import { AppView, WalletState, TransactionType, TransactionStatus, TESTNET_ADDRESS, MAINNET_ADDRESS, Network } from './types';
import { executeBitcoinCli } from './services/bitcoinCli';

const INITIAL_WALLET_STATE: WalletState = {
  btcBalance: 0,
  fiatBalance: 0,
  transactions: [],
  addressBalances: []
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [network, setNetwork] = useState<Network>('TESTNET');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [fetchedBalance, setFetchedBalance] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Custom Address State
  const [addresses, setAddresses] = useState({
    TESTNET: TESTNET_ADDRESS,
    MAINNET: MAINNET_ADDRESS
  });
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch Bitcoin Price
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

  const currentAddress = addresses[network];
  const hasWallet = Boolean(addresses.TESTNET || addresses.MAINNET);

  // Define sync logic as a reusable function
  const refreshWalletData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const context = { address: currentAddress };
      
      // Fetch Balance
      const balance = await executeBitcoinCli('getbalance', [], network, context);
      setFetchedBalance(balance);

      // Fetch Transactions using listtransactions with count=20
      const transactions = await executeBitcoinCli('listtransactions', ['*', '20'], network, context);
      
      // Fetch Address Balances
      const addressBalances = await executeBitcoinCli('listaddressgroupings', [], network, context);

      setWalletState(prev => ({ ...prev, transactions, addressBalances }));
      
    } catch (e) {
      console.error("Failed to sync with node:", e);
      // If sync fails (e.g. no wallet), ensure state is consistent with empty wallet if intended
      if (!currentAddress) {
          setFetchedBalance(0);
          setWalletState(INITIAL_WALLET_STATE);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [network, currentAddress]);

  // Initial fetch and fetch on dependencies change
  useEffect(() => {
    refreshWalletData();
  }, [refreshWalletData]);

  const handleImportWallet = async (input: string) => {
    setIsSyncing(true);
    try {
        let descriptor = input.trim();
        
        // Detect input type
        const isDescriptor = descriptor.startsWith('wpkh(') || descriptor.startsWith('tr(') || descriptor.startsWith('pkh(') || descriptor.startsWith('sh(');
        
        if (!isDescriptor) {
            // Simulate BIP39 Tool conversion from Mnemonic/Seed to Descriptor
            // We mock the xprv generation for the simulation
            // In a real app, this would use bip39 and bip32 libraries
            
            // Generate a deterministic mock xprv based on the input string to ensure consistency
            const seedHash = btoa(input).substring(0, 30).replace(/[^a-zA-Z0-9]/g, '');
            const xprvPrefix = network === 'TESTNET' ? 'tprv' : 'xprv';
            const mockXprv = `${xprvPrefix}8ZgxMBicQKsPd${seedHash}X1Y2Z3`;
            
            // Standard BIP84 Path for Native Segwit
            const path = network === 'TESTNET' ? "84'/1'/0'" : "84'/0'/0'";
            const fingerprint = "d34db33f"; // Mock fingerprint
            
            // Construct the full descriptor with xprv and path as requested
            descriptor = `wpkh([${fingerprint}/${path}]${mockXprv}/0/*)#checksum`;
            
            console.log("Converted Seed to Descriptor:", descriptor);
        }

        // Prepare the JSON payload for importdescriptors
        // It requires an array of descriptor objects
        const requestPayload = [{
            desc: descriptor,
            active: true,
            timestamp: "now",
            range: [0, 1000],
            label: "imported-wallet"
        }];

        // Execute importdescriptors command
        const importedAddress = await executeBitcoinCli(
            'importdescriptors', 
            [JSON.stringify(requestPayload)], 
            network, 
            { address: '' }
        );

        if (importedAddress) {
            setAddresses(prev => ({
                ...prev,
                [network]: importedAddress
            }));
            setCurrentView(AppView.DASHBOARD);
        }
    } catch (e) {
        console.error("Import failed:", e);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setAddresses({
        TESTNET: '',
        MAINNET: ''
    });
    setWalletState(INITIAL_WALLET_STATE);
    setFetchedBalance(0);
    setCurrentView(AppView.DASHBOARD);
    setIsMobileMenuOpen(false);
  };

  const handleClearTransactions = () => {
    setWalletState(prev => ({ ...prev, transactions: [] }));
  };

  // Calculate dynamic fiat balance and update transaction values
  const displayedWalletState: WalletState = {
    ...walletState,
    btcBalance: fetchedBalance,
    fiatBalance: fetchedBalance * btcPrice,
    transactions: walletState.transactions.map(tx => ({
      ...tx,
      fiatValue: tx.amount * btcPrice
    }))
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
      <ImportWalletModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onImport={handleImportWallet} 
      />

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
          <NavItem view={AppView.AIRDROP} icon={Users} label="Airdrop Friends" />
          <NavItem view={AppView.RECEIVE} icon={Download} label="Receive" />
          <NavItem view={AppView.ADVISOR} icon={Bot} label="AI Advisor" />
          <NavItem view={AppView.CLI} icon={Terminal} label="Bitcoin CLI" />
          
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
            <button 
              onClick={() => { setShowImportModal(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all duration-200"
            >
              <KeyRound size={20} />
              <span>Import Wallet</span>
            </button>
            
            {hasWallet && (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all duration-200"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            )}
          </div>
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
          <NavItem view={AppView.AIRDROP} icon={Users} label="Airdrop Friends" />
          <NavItem view={AppView.RECEIVE} icon={Download} label="Receive" />
          <NavItem view={AppView.ADVISOR} icon={Bot} label="AI Advisor" />
          <NavItem view={AppView.CLI} icon={Terminal} label="Bitcoin CLI" />
          
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
             <button 
                onClick={() => { setShowImportModal(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all duration-200"
              >
                <KeyRound size={20} />
                <span>Import Wallet</span>
            </button>
            {hasWallet && (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all duration-200"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            )}
          </div>
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
               currentView === AppView.AIRDROP ? 'Airdrop & Friends' :
               currentView.toLowerCase()}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {/* Network Indicator / Toggle */}
            <button 
              onClick={toggleNetwork}
              disabled={isSyncing}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all border ${
                network === 'MAINNET' 
                  ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-900/40' 
                  : 'bg-amber-950/30 border-amber-500/50 hover:bg-amber-900/40'
              } ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'animate-ping' : 'animate-pulse'} ${
                network === 'MAINNET' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></div>
              <span className={`text-xs font-medium ${
                network === 'MAINNET' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {isSyncing ? 'Syncing...' : (network === 'MAINNET' ? 'Mainnet' : 'Testnet')}
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
                currentAddress={currentAddress}
                onNavigate={handleNavigate}
                onClearTransactions={handleClearTransactions}
                onRefresh={refreshWalletData}
                isRefreshing={isSyncing}
              />
            )}
            {currentView === AppView.SEND && <SendForm network={network} currentAddress={currentAddress} />}
            {currentView === AppView.AIRDROP && <Airdrop network={network} currentAddress={currentAddress} />}
            {currentView === AppView.ADVISOR && <GeminiAdvisor />}
            {currentView === AppView.CLI && <Console network={network} currentAddress={currentAddress} />}
            {currentView === AppView.RECEIVE && (
              <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Receive Bitcoin <span className="text-lg text-slate-500 align-top">({network})</span></h2>
                  <p className="text-slate-400">Scan the QR code or copy the address below</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-white/5">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${currentAddress || 'not-configured'}`} 
                    alt="Wallet QR Code" 
                    className="w-64 h-64 mix-blend-multiply"
                  />
                </div>

                <div className="w-full max-w-2xl bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                  <code className="text-amber-500 font-mono text-sm truncate mr-4">
                    {currentAddress || 'Generating... (Please Create/Import Wallet)'}
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