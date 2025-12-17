import { Network, Transaction, TransactionType, TransactionStatus, AddressBalance } from '../types';

interface WalletContext {
  address: string;
}

// In-memory store for simulation (Session persistence)
// Key: "NETWORK:ADDRESS", Value: Transaction[]
const TX_STORE: Record<string, Transaction[]> = {};

// Server Simulation State
let isNodeRunning = true;
let startUpTime = Date.now();

// Real RPC Configuration State
let rpcConfig = {
    url: '',
    user: '',
    pass: '',
    active: false
};

export const getNodeStatus = () => ({
    running: isNodeRunning,
    uptime: isNodeRunning ? Math.floor((Date.now() - startUpTime) / 1000) : 0,
    mode: rpcConfig.active ? 'REAL' : 'SIMULATION',
    rpcUrl: rpcConfig.url
});

// --- HELPER: Map Real Bitcoin Core Responses to App Types ---

const mapRealTransactions = (txs: any[]): Transaction[] => {
    if (!Array.isArray(txs)) return [];
    return txs.map((tx: any) => ({
        id: tx.txid,
        type: tx.category === 'receive' ? TransactionType.RECEIVE : TransactionType.SEND,
        amount: Math.abs(tx.amount),
        fiatValue: 0, // Real node doesn't provide fiat value
        date: new Date(tx.time * 1000).toLocaleDateString(),
        timestamp: tx.time * 1000,
        address: tx.address || 'Unknown',
        status: tx.confirmations > 0 ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
        confirmations: tx.confirmations,
        fee: Math.abs(tx.fee || 0),
        inputs: [], 
        outputs: []
    }));
};

const mapRealAddressGroupings = (groups: any[]): AddressBalance[] => {
    if (!Array.isArray(groups)) return [];
    const balances: AddressBalance[] = [];
    // listaddressgroupings returns [ [ [address, amount, label?], ... ], ... ]
    for (const group of groups) {
        for (const item of group) {
            if (Array.isArray(item) && item.length >= 2) {
                balances.push({
                    address: item[0],
                    amount: item[1],
                    label: item[2] || ''
                });
            }
        }
    }
    return balances;
};

// --- HELPER: Execute Real RPC Call ---
const callRealNode = async (method: string, params: any[]): Promise<any> => {
    if (!rpcConfig.url) throw new Error("RPC URL not configured");

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${rpcConfig.user}:${rpcConfig.pass}`)
    };

    const body = JSON.stringify({
        jsonrpc: "1.0",
        id: "zenith-wallet",
        method: method,
        params: params
    });

    try {
        const response = await fetch(rpcConfig.url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
             if (response.status === 401) throw new Error("Authentication failed (401). Check username/password.");
             if (response.status === 403) throw new Error("Access denied (403). Check CORS/Allowip settings.");
             throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`RPC Error: ${data.error.message} (code: ${data.error.code})`);
        }
        return data.result;

    } catch (error: any) {
        // Enhance error message for common browser issues
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error(`Connection failed. Possible causes:
1. CORS blocked by browser (Node needs a proxy).
2. Node is unreachable at ${rpcConfig.url}.
3. Node is not running.`);
        }
        throw error;
    }
};

// --- SIMULATION HELPERS ---

const generateHash = () => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
};

const generateInitialHistory = (address: string, network: Network): Transaction[] => {
  if (!address) return [];
  const history: Transaction[] = [];
  const now = Date.now();
  const DAY_MS = 86400000;
  const isTest = network === 'TESTNET';

  history.push({
    id: generateHash(),
    type: TransactionType.RECEIVE,
    amount: isTest ? 2.5 : 0.15,
    fiatValue: 0,
    date: new Date(now - 30 * DAY_MS).toLocaleDateString(),
    timestamp: now - 30 * DAY_MS,
    address: address,
    status: TransactionStatus.COMPLETED,
    confirmations: 4320,
    fee: 0,
    inputs: [],
    outputs: [{ address: address, amount: isTest ? 2.5 : 0.15 }]
  });

  return history;
};

const getStoreKey = (network: Network, address: string) => `${network}:${address}`;

const getHistory = (network: Network, address: string): Transaction[] => {
  const key = getStoreKey(network, address);
  if (!TX_STORE[key]) {
    TX_STORE[key] = generateInitialHistory(address, network);
  }
  return TX_STORE[key];
};

const saveHistory = (network: Network, address: string, history: Transaction[]) => {
  const key = getStoreKey(network, address);
  TX_STORE[key] = history;
};

const calculateBalance = (history: Transaction[]): number => {
  return history.reduce((acc, tx) => {
    if (tx.status === TransactionStatus.FAILED) return acc;
    if (tx.type === TransactionType.RECEIVE) {
      return acc + tx.amount;
    } else {
      return acc - tx.amount - (tx.fee || 0);
    }
  }, 0);
};

// --- MAIN EXECUTION FUNCTION ---

export const executeBitcoinCli = async (
  command: string, 
  args: string[], 
  network: Network,
  context?: WalletContext
): Promise<any> => {
  
  // Clean args (remove flags like -conf, -datadir for simplicity in both modes)
  const cleanArgs = args.filter(a => !a.startsWith('-'));
  const lowerCmd = command.toLowerCase();

  // --- 1. HANDLE SPECIAL COMMANDS (Mode Switching / Server Control) ---

  // Connect to Real Node
  if (lowerCmd === 'connect') {
      if (cleanArgs.length < 3) throw new Error("Usage: connect <url> <user> <password>\nExample: connect http://127.0.0.1:8332 user pass");
      rpcConfig = {
          url: cleanArgs[0],
          user: cleanArgs[1],
          pass: cleanArgs[2],
          active: true
      };
      // Test connection
      try {
          await callRealNode('getblockchaininfo', []);
          return `Successfully connected to ${rpcConfig.url}. Switching to REAL mode.`;
      } catch (e: any) {
          rpcConfig.active = false;
          throw new Error(`Connection test failed: ${e.message}`);
      }
  }

  // Disconnect (Back to Simulation)
  if (lowerCmd === 'disconnect') {
      rpcConfig.active = false;
      return "Disconnected from remote node. Switched back to SIMULATION mode.";
  }

  // Wrapper: bitcoin-cli <cmd> ...
  if (lowerCmd === 'bitcoin-cli') {
      if (cleanArgs.length === 0) throw new Error("Usage: bitcoin-cli <command> [params] ");
      const subCommand = cleanArgs[0];
      const subArgs = cleanArgs.slice(1);
      return executeBitcoinCli(subCommand, subArgs, network, context);
  }

  // Server Management (Simulation Only)
  if (!rpcConfig.active) {
    if (lowerCmd === 'bitcoind') {
        if (isNodeRunning) return "Zenith Bitcoin Core is already running.";
        isNodeRunning = true;
        startUpTime = Date.now();
        return "STARTING_SEQUENCE"; 
    }
    if (lowerCmd === 'stop') {
        if (!isNodeRunning) return "Zenith Bitcoin Core is not running.";
        isNodeRunning = false;
        return "Zenith Bitcoin Core server stopping";
    }
  } else {
    if (lowerCmd === 'bitcoind') return "Cannot start local bitcoind while connected to remote node.";
    if (lowerCmd === 'stop') {
        // We could send 'stop' to real node, but that's dangerous for a web UI.
        return "Stopping remote node via web UI is restricted for safety.";
    }
  }

  // Check Node Status
  if (!rpcConfig.active && !isNodeRunning) {
      throw new Error(`error: couldn't connect to server: Connection refused\nIs bitcoind running?`);
  }

  // --- 2. REAL MODE EXECUTION ---
  if (rpcConfig.active) {
      const result = await callRealNode(lowerCmd, cleanArgs);
      
      // Post-process specific commands to match UI expectations
      if (lowerCmd === 'listtransactions') return mapRealTransactions(result);
      if (lowerCmd === 'listaddressgroupings') return mapRealAddressGroupings(result);
      
      return result;
  }

  // --- 3. SIMULATION MODE EXECUTION ---

  // Simulate latency
  await new Promise(resolve => setTimeout(resolve, 300));

  const currentAddress = context?.address || '';
  if (!currentAddress && ['getbalance', 'sendtoaddress', 'listtransactions', 'generatetoaddress', 'sendmany', 'listreceivedbyaddress', 'getaddressinfo', 'listaddressgroupings', 'getwalletinfo', 'listunspent', 'dumpwallet', 'signrawtransactionwithwallet'].includes(lowerCmd)) {
     throw new Error("No wallet loaded. Please import or create a wallet.");
  }

  const history = currentAddress ? getHistory(network, currentAddress) : [];

  switch (lowerCmd) {
    case 'help':
        return `
Zenith Bitcoin Core RPC Client (v26.0.0)
Mode: ${rpcConfig.active ? 'REAL CONNECTION' : 'SIMULATION'}

== Connection ==
connect <url> <user> <pass>   Connect to a real Bitcoin Core node (via proxy)
disconnect                    Switch back to simulation mode

== Server Control (Sim Only) ==
bitcoind, stop

== Wallet ==
getbalance, getnewaddress, getaddressinfo, sendtoaddress, listreceivedbyaddress, listunspent, getwalletinfo, dumpwallet, encryptwallet, importdescriptors, generatetoaddress, sendmany

== Blockchain ==
getblockchaininfo, getblockcount, getbestblockhash, getblock, getblockhash
`;

    case 'importdescriptors':
        // Simplified mock for import
        if (network === 'TESTNET') return 'tb1ppksphu4jfv0watdurwzzlp9vstryak0mwz05xsqrza4xxp7e3hfs2w6cqj';
        return 'bc1q...imported';

    case 'getbalance':
       return calculateBalance(history);
    
    case 'getnewaddress':
       return currentAddress;

    case 'listaddressgroupings':
       const mainBalance = calculateBalance(history);
       return [{
           address: currentAddress,
           amount: mainBalance,
           label: "Primary"
       }];
    
    case 'getaddressinfo':
       const targetAddr = cleanArgs[0] || currentAddress;
       if (!targetAddr) throw new Error("Usage: getaddressinfo <address>");
       const isTaproot = targetAddr.startsWith('tb1p') || targetAddr.startsWith('bc1p');
       return {
         address: targetAddr,
         ismine: targetAddr === currentAddress,
         desc: isTaproot ? `tr(${targetAddr})#checksum` : `wpkh(${targetAddr})#checksum`,
         timestamp: Math.floor(Date.now() / 1000),
         labels: targetAddr === currentAddress ? ["default"] : []
       };

    case 'listtransactions':
       const count = cleanArgs[1] ? parseInt(cleanArgs[1]) : 10;
       const skip = cleanArgs[2] ? parseInt(cleanArgs[2]) : 0;
       const reversed = [...history].reverse();
       return reversed.slice(skip, skip + count);

    case 'listreceivedbyaddress':
       const totalReceived = history.filter(tx => tx.type === TransactionType.RECEIVE).reduce((sum, tx) => sum + tx.amount, 0);
       return totalReceived > 0 ? [{ address: currentAddress, amount: totalReceived, confirmations: 0, label: "default" }] : [];

    case 'sendtoaddress':
       if (cleanArgs.length < 2) throw new Error("Usage: sendtoaddress <address> <amount>");
       const recipient = cleanArgs[0];
       const amount = parseFloat(cleanArgs[1]);
       
       if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
       if (calculateBalance(history) < amount + 0.000015) throw new Error("Insufficient funds");

       const newTx: Transaction = {
         id: generateHash(),
         type: TransactionType.SEND,
         amount: amount,
         fiatValue: 0, 
         date: new Date().toLocaleDateString(),
         timestamp: Date.now(),
         address: recipient,
         status: TransactionStatus.COMPLETED,
         fee: 0.000015,
         confirmations: 0,
         inputs: [],
         outputs: []
       };
       history.push(newTx);
       saveHistory(network, currentAddress, history);
       return newTx.id;

    case 'sendmany':
        // Simplified sendmany simulation
        const smTx: Transaction = {
            id: generateHash(),
            type: TransactionType.SEND,
            amount: 0.1, 
            fiatValue: 0,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            address: "Multiple Recipients",
            status: TransactionStatus.COMPLETED,
            fee: 0.00005,
            confirmations: 0
        };
        history.push(smTx);
        saveHistory(network, currentAddress, history);
        return smTx.id;

    case 'getconnectioncount':
       return Math.floor(Math.random() * 5) + 8;

    case 'getblockchaininfo':
      return {
        chain: network === 'TESTNET' ? "test" : "main",
        blocks: network === 'TESTNET' ? 2578021 : 834120,
        headers: network === 'TESTNET' ? 2578021 : 834120,
        verificationprogress: 0.99999
      };

    case 'listunspent':
        const bal = calculateBalance(history);
        return bal > 0 ? [{ txid: generateHash(), vout: 0, address: currentAddress, amount: bal, safe: true }] : [];

    case 'getwalletinfo':
        return {
            walletname: "ZenithSim",
            balance: calculateBalance(history),
            txcount: history.length,
            keypoolsize: 1000
        };

    case 'dumpwallet':
        if (!cleanArgs[0]) throw new Error("Usage: dumpwallet <filename>");
        return { filename: cleanArgs[0], warning: "Simulation only." };

    case 'encryptwallet':
        if (!cleanArgs[0]) throw new Error("Usage: encryptwallet <passphrase>");
        return "wallet encrypted.";

    case 'getblockcount':
        return network === 'TESTNET' ? 2578021 : 834120;

    case 'getbestblockhash':
        return "0000000000000000000182746c8f92j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9";

    default:
       throw new Error(`Command not found: ${lowerCmd}. Type "help" for a list of commands.`);
  }
};