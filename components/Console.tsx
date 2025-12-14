import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2, ChevronRight, Command, ChevronDown, Server, Power } from 'lucide-react';
import { EXAMPLE_ADDRESS, Network } from '../types';
import { executeBitcoinCli, getNodeStatus } from '../services/bitcoinCli';

interface ConsoleProps {
  network: Network;
  currentAddress: string;
}

interface ConsoleLine {
  type: 'input' | 'output' | 'error' | 'system' | 'log';
  content: string | object;
}

// Recursive JSON Renderer Component
const JsonRenderer: React.FC<{ value: any; root?: boolean }> = ({ value, root = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (value === null) return <span className="text-rose-400 font-mono">null</span>;
  if (value === undefined) return <span className="text-slate-500 font-mono">undefined</span>;
  
  if (typeof value === 'boolean') return <span className="text-purple-400 font-bold font-mono">{value.toString()}</span>;
  if (typeof value === 'number') return <span className="text-amber-400 font-mono">{value}</span>;
  if (typeof value === 'string') return <span className="text-emerald-300 font-mono break-all">"{value}"</span>;

  const isArray = Array.isArray(value);
  const isEmpty = Object.keys(value).length === 0;

  if (isEmpty) {
    return <span className="text-slate-500 font-mono">{isArray ? '[]' : '{}'}</span>;
  }

  const Brackets = ({ open }: { open: boolean }) => (
    <span className="text-slate-400 font-bold font-mono">{open ? (isArray ? '[' : '{') : (isArray ? ']' : '}')}</span>
  );

  return (
    <div className={`inline-block align-top ${root ? 'w-full' : ''}`}>
      <div 
        onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }} 
        className="cursor-pointer hover:bg-slate-800/50 rounded px-1 -ml-1 inline-flex items-center select-none group transition-colors"
      >
        <span className={`mr-1 text-slate-600 group-hover:text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
          <ChevronDown size={12} />
        </span>
        <Brackets open={true} />
        {isCollapsed && <span className="text-slate-600 text-xs mx-1 font-mono">...</span>}
        {isCollapsed && <Brackets open={false} />}
        {isCollapsed && <span className="ml-2 text-xs text-slate-600 font-mono">{Object.keys(value).length} items</span>}
      </div>

      {!isCollapsed && (
        <div className="pl-4 border-l border-slate-800 ml-[0.35rem] my-1">
          {Object.entries(value).map(([key, val], index, arr) => (
            <div key={key} className="my-0.5 flex items-start">
              {!isArray && <span className="text-blue-300 mr-2 font-mono whitespace-nowrap opacity-90">"{key}":</span>}
              <div className="flex-1 min-w-0">
                <JsonRenderer value={val} />
                {index < arr.length - 1 && <span className="text-slate-500 font-mono">,</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {!isCollapsed && <Brackets open={false} />}
    </div>
  );
};

const Console: React.FC<ConsoleProps> = ({ network, currentAddress }) => {
  const [history, setHistory] = useState<ConsoleLine[]>([
    { type: 'system', content: `Zenith Bitcoin Core RPC client version v26.0.0 (${network})` },
    { type: 'system', content: 'Type "help" for an overview of available commands.' }
  ]);
  const [input, setInput] = useState('');
  const [serverStatus, setServerStatus] = useState(getNodeStatus());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholderAddress = currentAddress || EXAMPLE_ADDRESS;
  const promptHost = network === 'TESTNET' ? 'zenith-testnet' : 'zenith-mainnet';

  // Poll for server status (e.g. up/down/uptime)
  useEffect(() => {
      const interval = setInterval(() => {
          setServerStatus(getNodeStatus());
      }, 1000);
      return () => clearInterval(interval);
  }, []);

  const COMMAND_GROUPS = {
    Server: [
        { cmd: 'bitcoind', args: false },
        { cmd: 'stop', args: false },
        { cmd: 'getconnectioncount', args: false },
    ],
    Wallet: [
      { cmd: 'getbalance', args: false },
      { cmd: 'getnewaddress', args: false },
      { cmd: 'getaddressinfo', args: true, template: `getaddressinfo ${placeholderAddress}` },
      { cmd: 'sendtoaddress', args: true, template: `sendtoaddress ${placeholderAddress} 0.001` },
      { cmd: 'listreceivedbyaddress', args: true, template: 'listreceivedbyaddress 0 true' },
      { cmd: 'listunspent', args: false },
      { cmd: 'getwalletinfo', args: false },
      { cmd: 'dumpwallet', args: true, template: 'dumpwallet wallet.dat' },
      { cmd: 'encryptwallet', args: true, template: 'encryptwallet mypassphrase' },
    ],
    Blockchain: [
      { cmd: 'getblockchaininfo', args: false },
      { cmd: 'getblockcount', args: false },
      { cmd: 'getbestblockhash', args: false },
      { cmd: 'getblock', args: true, template: 'getblock 000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f' },
      { cmd: 'getblockhash', args: true, template: 'getblockhash 0' },
    ],
    Utility: [
      { cmd: 'createrawtransaction', args: false },
      { cmd: 'decoderawtransaction', args: true, template: 'decoderawtransaction 0200...' },
      { cmd: 'signrawtransactionwithwallet', args: true, template: 'signrawtransactionwithwallet 0200...' },
      { cmd: 'sendrawtransaction', args: true, template: 'sendrawtransaction 0200...' },
      { cmd: 'getrawtransaction', args: true, template: 'getrawtransaction <txid>' },
      { cmd: 'estimatesmartfee', args: true, template: 'estimatesmartfee 6' },
      { cmd: 'validateaddress', args: true, template: `validateaddress ${placeholderAddress}` },
    ]
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    // Reset or notify when network changes
    setHistory(prev => [...prev, { type: 'system', content: `Switched to ${network} mode.` }]);
  }, [network]);

  const simulateStartupLogs = async () => {
      const logs = [
          "2024-05-15T10:00:01Z Bitcoin Core version v26.0.0 (release build)",
          "2024-05-15T10:00:01Z InitParameterInteraction: parameter interaction: -whitelistforcerelay=1 -> -whitelistrelay=1",
          "2024-05-15T10:00:02Z Validating signatures for all blocks so far...",
          "2024-05-15T10:00:02Z Scheduler thread start",
          "2024-05-15T10:00:03Z Loading block index...",
          "2024-05-15T10:00:04Z Block index loaded. Rewinding blocks...",
          "2024-05-15T10:00:05Z Verifying blocks...",
          "2024-05-15T10:00:06Z Block verification complete.",
          "2024-05-15T10:00:07Z init message: Loading wallet...",
          "2024-05-15T10:00:08Z Registering wallet signals...",
          "2024-05-15T10:00:09Z Net thread start",
          "2024-05-15T10:00:10Z dnsseed thread start",
          "2024-05-15T10:00:11Z Done loading"
      ];

      for (const log of logs) {
          await new Promise(r => setTimeout(r, 400));
          setHistory(prev => [...prev, { type: 'log', content: log }]);
      }
      setHistory(prev => [...prev, { type: 'system', content: "Zenith Bitcoin Core server started successfully." }]);
      setServerStatus(getNodeStatus());
  };

  const handleCommand = async (cmd: string) => {
    const args = cmd.trim().split(' ');
    const command = args[0].toLowerCase();
    
    // Client-side only commands
    if (command === 'clear') {
        setHistory([]);
        return;
    }

    // Optimistically add input to history
    setHistory(prev => [...prev, { type: 'input', content: cmd }]);

    try {
      // Execute command via the simulate service
      const serviceResult = await executeBitcoinCli(command, args.slice(1), network, { address: currentAddress });
      
      // Special Handling for "bitcoind" command visualization
      if (serviceResult === "STARTING_SEQUENCE") {
          await simulateStartupLogs();
          return;
      }
      
      if (serviceResult !== undefined && serviceResult !== null) {
        setHistory(prev => [...prev, { type: 'output', content: serviceResult }]);
      }
    } catch (e: any) {
      setHistory(prev => [...prev, { type: 'error', content: e.message || 'Error executing command.' }]);
    }
  };

  const handleQuickAction = (cmdObj: { cmd: string, args: boolean, template?: string }) => {
    if (cmdObj.args && cmdObj.template) {
        setInput(cmdObj.template);
        inputRef.current?.focus();
    } else {
        handleCommand(cmdObj.cmd);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!input.trim()) return;
      handleCommand(input);
      setInput('');
    }
  };

  const formatUptime = (sec: number) => {
      if (sec < 60) return `${sec}s`;
      if (sec < 3600) return `${Math.floor(sec/60)}m`;
      return `${Math.floor(sec/3600)}h`;
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
        
      {/* Node Status Indicator Bar */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                  <div className="relative">
                      {serverStatus.running && <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>}
                      <div className={`w-3 h-3 rounded-full relative z-10 ${serverStatus.running ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  </div>
                  <span className={`text-sm font-medium ${serverStatus.running ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {serverStatus.running ? 'Node Running' : 'Node Stopped'}
                  </span>
              </div>
              
              <div className="h-4 w-px bg-slate-700 mx-2"></div>
              
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Server size={14} />
                  <span className="font-mono">v26.0.0</span>
              </div>

              {serverStatus.running && (
                  <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
                     <span className="text-slate-600">|</span>
                     <span>Uptime: {formatUptime(serverStatus.uptime)}</span>
                  </div>
              )}
          </div>

          <div>
             <button 
                onClick={() => handleCommand(serverStatus.running ? 'stop' : 'bitcoind')}
                className={`text-xs flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                    serverStatus.running 
                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' 
                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                }`}
             >
                 <Power size={12} />
                 <span>{serverStatus.running ? 'Stop Node' : 'Start Node'}</span>
             </button>
          </div>
      </div>

      <div className="flex-1 flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-sm">
        
        {/* Sidebar Controls */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-slate-200 font-semibold flex items-center space-x-2">
                <Command size={16} className="text-amber-500"/>
                <span>Quick Commands</span>
            </h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-4 custom-scrollbar">
                {Object.entries(COMMAND_GROUPS).map(([group, commands]) => (
                    <div key={group}>
                        <h4 className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{group}</h4>
                        <div className="space-y-1">
                            {commands.map((c) => (
                                <button
                                    key={c.cmd}
                                    onClick={() => handleQuickAction(c)}
                                    className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors flex items-center group"
                                >
                                    <ChevronRight size={12} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500"/>
                                    <span className="truncate">{c.cmd}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Terminal Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                <TerminalIcon className="text-emerald-500 w-4 h-4" />
                <span className="text-slate-300 font-medium">user@{promptHost}:~</span>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => setHistory([])} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300" title="Clear">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 cursor-text" onClick={() => inputRef.current?.focus()}>
                {history.map((line, idx) => (
                <div key={idx} className={`${
                    line.type === 'input' ? 'mt-4' : ''
                }`}>
                    {line.type === 'input' && (
                    <div className="text-slate-100 font-bold flex items-center">
                        <span className="text-amber-500 mr-2">$</span>
                        <span>{line.content as string}</span>
                    </div>
                    )}
                    
                    {line.type === 'error' && (
                    <div className="text-rose-500 whitespace-pre-wrap">{line.content as string}</div>
                    )}
                    
                    {line.type === 'system' && (
                    <div className="text-slate-400 italic mb-2">{line.content as string}</div>
                    )}

                    {line.type === 'log' && (
                    <div className="text-slate-500 font-mono text-xs">{line.content as string}</div>
                    )}

                    {line.type === 'output' && (
                    <div className="text-slate-300">
                        {typeof line.content === 'object' ? (
                        <JsonRenderer value={line.content} root={true} />
                        ) : (
                        <div className="whitespace-pre-wrap text-emerald-500">{line.content as string}</div>
                        )}
                    </div>
                    )}
                </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Line */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center">
                <span className="text-amber-500 mr-2 font-bold">$</span>
                <input 
                ref={inputRef}
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-700 w-full"
                placeholder="Enter command (e.g., bitcoind, bitcoin-cli getbalance)..."
                autoFocus
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Console;