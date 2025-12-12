import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2, ChevronRight, Command } from 'lucide-react';
import { TESTNET_ADDRESS, MAINNET_ADDRESS, Network } from '../types';

interface ConsoleProps {
  network: Network;
}

interface ConsoleLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
}

const Console: React.FC<ConsoleProps> = ({ network }) => {
  const [history, setHistory] = useState<ConsoleLine[]>([
    { type: 'system', content: `Zenith Bitcoin Core RPC client version v26.0.0 (${network})` },
    { type: 'system', content: 'Type "help" for an overview of available commands.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentAddress = network === 'TESTNET' ? TESTNET_ADDRESS : MAINNET_ADDRESS;
  const promptHost = network === 'TESTNET' ? 'zenith-testnet' : 'zenith-mainnet';

  const COMMAND_GROUPS = {
    Wallet: [
      { cmd: 'getbalance', args: false },
      { cmd: 'getnewaddress', args: false },
      { cmd: 'sendtoaddress', args: true, template: `sendtoaddress ${currentAddress} 0.001` },
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
      { cmd: 'validateaddress', args: true, template: `validateaddress ${currentAddress}` },
    ]
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    // Reset or notify when network changes
    setHistory(prev => [...prev, { type: 'system', content: `Switched to ${network} mode.` }]);
  }, [network]);

  const handleCommand = (cmd: string) => {
    const args = cmd.trim().split(' ');
    const command = args[0].toLowerCase();
    
    let output = '';
    let type: ConsoleLine['type'] = 'output';

    switch (command) {
      case 'help':
        output = `
Available commands:
${Object.keys(COMMAND_GROUPS).map(group => `\n== ${group} ==\n${COMMAND_GROUPS[group as keyof typeof COMMAND_GROUPS].map(c => c.cmd).join('\n')}`).join('\n')}
        `;
        break;
      case 'clear':
        setHistory([]);
        return;
      case 'getbalance':
        output = '1.24503211';
        break;
      case 'getnewaddress':
        output = currentAddress;
        break;
      case 'sendtoaddress':
        if (args.length < 3) {
            output = 'Error: Invalid parameters. Usage: sendtoaddress <address> <amount>';
            type = 'error';
        } else {
            output = 'txid: ' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
        }
        break;
      case 'listunspent':
        output = JSON.stringify([
          { txid: "d4f3...", vout: 0, address: currentAddress, amount: 0.50000000, confirmations: 120 },
          { txid: "a1b2...", vout: 1, address: currentAddress, amount: 0.74503211, confirmations: 6 }
        ], null, 2);
        break;
      case 'getwalletinfo':
        output = JSON.stringify({
          walletname: network === 'TESTNET' ? "ZenithTest" : "ZenithMain",
          walletversion: 169900,
          balance: 1.24503211,
          unconfirmed_balance: 0.00000000,
          immature_balance: 0.00000000,
          txcount: 42,
          keypoololdest: 1698000000,
          keypoolsize: 1000
        }, null, 2);
        break;
      case 'dumpwallet':
        output = args[1] 
            ? `Wallet dumped to file: ${args[1]}` 
            : 'Error: Please specify a filename';
        if (!args[1]) type = 'error';
        break;
      case 'encryptwallet':
        output = 'wallet encrypted; The keypool has been flushed and a new one generated. The wallet is now locked.';
        break;
      case 'getblockchaininfo':
        output = JSON.stringify({
          chain: network === 'TESTNET' ? "test" : "main",
          blocks: 834120,
          headers: 834120,
          bestblockhash: "0000000000000000000182...",
          difficulty: 72000000000000,
          mediantime: 1709200000,
          verificationprogress: 0.99999
        }, null, 2);
        break;
      case 'getblockcount':
        output = '834120';
        break;
      case 'getbestblockhash':
        output = '0000000000000000000182746c8f92j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9';
        break;
      case 'getblock':
        output = JSON.stringify({
          hash: args[1] || "0000... (example)",
          confirmations: 1,
          size: 1523,
          weight: 4000,
          height: 834120,
          version: 536870912,
          merkleroot: "a1b2...",
          tx: ["tx1...", "tx2..."],
          time: 1709200000
        }, null, 2);
        break;
      case 'getblockhash':
        output = '0000000000000000000182746c8f92j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9';
        break;
      case 'createrawtransaction':
        output = '0200000001' + Math.random().toString(16).substring(2);
        break;
      case 'decoderawtransaction':
        output = JSON.stringify({ txid: "...", version: 2, locktime: 0, vin: [], vout: [] }, null, 2);
        break;
      case 'signrawtransactionwithwallet':
        output = JSON.stringify({ hex: "0200...", complete: true }, null, 2);
        break;
      case 'sendrawtransaction':
         output = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
         break;
      case 'getrawtransaction':
        output = '0200000001' + Math.random().toString(16).substring(2) + '...';
        break;
      case 'estimatesmartfee':
        output = JSON.stringify({ feerate: 0.00001000, blocks: args[1] || 6 }, null, 2);
        break;
      case 'validateaddress':
        output = JSON.stringify({
          isvalid: true,
          address: args[1] || currentAddress,
          scriptPubKey: "5120...",
          isscript: false,
          iswitness: true
        }, null, 2);
        break;
      default:
        output = `Command not found: ${command}. Type "help" for a list of commands.`;
        type = 'error';
    }

    setHistory(prev => [
      ...prev, 
      { type: 'input', content: cmd },
      { type, content: output }
    ]);
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

  return (
    <div className="flex h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-sm animate-fade-in">
      
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
                line.type === 'input' ? 'text-slate-100 font-bold mt-4' : 
                line.type === 'error' ? 'text-rose-500' : 
                line.type === 'system' ? 'text-slate-400 italic' :
                'text-emerald-500 whitespace-pre-wrap break-words'
            }`}>
                {line.type === 'input' && <span className="text-amber-500 mr-2">$</span>}
                {line.content}
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
            placeholder="Enter command..."
            autoFocus
            />
        </div>
      </div>
    </div>
  );
};

export default Console;