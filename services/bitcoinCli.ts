import { Network, Transaction, TransactionType, TransactionStatus } from '../types';

interface WalletContext {
  address: string;
}

// In-memory store for simulation (Session persistence)
// Key: "NETWORK:ADDRESS", Value: Transaction[]
const TX_STORE: Record<string, Transaction[]> = {};

const generateHash = () => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
};

// Initial mock data generator (used only once per address)
const generateInitialHistory = (address: string, network: Network): Transaction[] => {
  if (!address) return [];
  
  const history: Transaction[] = [];
  const now = Date.now();
  const DAY_MS = 86400000;
  const isTest = network === 'TESTNET';

  // 1. Initial funding (Receive) - 30 days ago
  history.push({
    id: generateHash(),
    type: TransactionType.RECEIVE,
    amount: isTest ? 2.5 : 0.15,
    fiatValue: 0,
    date: new Date(now - 30 * DAY_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: now - 30 * DAY_MS,
    address: address,
    status: TransactionStatus.COMPLETED,
    confirmations: 4320,
    fee: 0,
    inputs: [],
    outputs: [{ address: address, amount: isTest ? 2.5 : 0.15 }]
  });

  // 2. Sent some funds - 15 days ago
  history.push({
    id: generateHash(),
    type: TransactionType.SEND,
    amount: isTest ? 0.5 : 0.01,
    fiatValue: 0,
    date: new Date(now - 15 * DAY_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: now - 15 * DAY_MS,
    address: isTest ? 'tb1q...vendor' : 'bc1q...vendor',
    status: TransactionStatus.COMPLETED,
    confirmations: 2100,
    fee: 0.000015,
    inputs: [{ address: address, amount: isTest ? 0.500015 : 0.010015 }],
    outputs: [{ address: isTest ? 'tb1q...vendor' : 'bc1q...vendor', amount: isTest ? 0.5 : 0.01 }]
  });

  // 3. Received small amount - 5 days ago
  history.push({
    id: generateHash(),
    type: TransactionType.RECEIVE,
    amount: isTest ? 0.25 : 0.005,
    fiatValue: 0,
    date: new Date(now - 5 * DAY_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: now - 5 * DAY_MS,
    address: address,
    status: TransactionStatus.COMPLETED,
    confirmations: 720,
    fee: 0,
    inputs: [],
    outputs: [{ address: address, amount: isTest ? 0.25 : 0.005 }]
  });
  
  // 4. Pending Receive - Today (Recent)
  history.push({
    id: generateHash(),
    type: TransactionType.RECEIVE,
    amount: isTest ? 0.1 : 0.002,
    fiatValue: 0,
    date: new Date(now - 1000 * 60 * 5).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // 5 mins ago
    timestamp: now - 1000 * 60 * 5,
    address: address,
    status: TransactionStatus.PENDING,
    confirmations: 0,
    fee: 0,
    inputs: [],
    outputs: [{ address: address, amount: isTest ? 0.1 : 0.002 }]
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
      // Deduct amount + fee
      return acc - tx.amount - (tx.fee || 0);
    }
  }, 0);
};

export const executeBitcoinCli = async (
  command: string, 
  args: string[], 
  network: Network,
  context?: WalletContext
): Promise<any> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 300));

  const currentAddress = context?.address || '';
  // Don't execute wallet commands without an address (except importdescriptors and others that create/load wallets)
  if (!currentAddress && ['getbalance', 'sendtoaddress', 'listtransactions', 'generatetoaddress', 'sendmany', 'listreceivedbyaddress', 'getaddressinfo', 'listaddressgroupings', 'getwalletinfo', 'listunspent', 'dumpwallet', 'signrawtransactionwithwallet'].includes(command.toLowerCase())) {
     throw new Error("No wallet loaded. Please import or create a wallet.");
  }

  const history = currentAddress ? getHistory(network, currentAddress) : [];

  switch (command.toLowerCase()) {
    case 'help':
        return `
Available commands:
== Wallet ==
getbalance, getnewaddress, getaddressinfo, sendtoaddress, listreceivedbyaddress, listunspent, getwalletinfo, dumpwallet, encryptwallet, importdescriptors, generatetoaddress, sendmany

== Blockchain ==
getblockchaininfo, getblockcount, getbestblockhash, getblock, getblockhash

== Utility ==
createrawtransaction, decoderawtransaction, signrawtransactionwithwallet, sendrawtransaction, getrawtransaction, estimatesmartfee, validateaddress, getconnectioncount
`;

    case 'importdescriptors':
        // usage: importdescriptors '[{"desc": "...", "active": true, ...}]'
        let requests;
        try {
            requests = JSON.parse(args[0]);
        } catch (e) {
            throw new Error("Invalid JSON format for importdescriptors requests. Expected '[{ ... }]'");
        }

        if (!Array.isArray(requests) || requests.length === 0 || !requests[0].desc) {
            throw new Error("Missing descriptor in request");
        }

        // Hardcoded return for TESTNET as requested
        if (network === 'TESTNET') {
            return 'tb1ppksphu4jfv0watdurwzzlp9vstryak0mwz05xsqrza4xxp7e3hfs2w6cqj';
        }

        const descriptor = requests[0].desc;
        
        // In a real implementation, Bitcoin Core would derive addresses from the descriptor range.
        // For this mock, we generate a deterministic address based on the descriptor string.
        let hash = 0;
        for (let i = 0; i < descriptor.length; i++) {
            hash = ((hash << 5) - hash) + descriptor.charCodeAt(i);
            hash |= 0;
        }
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        
        // Since we already returned if network === 'TESTNET', we know we are on MAINNET here.
        const suffix = hex + 'main';
        
        const prefix = 'bc1q';
        // Simulate a derived address from this descriptor
        const derivedAddr = `${prefix}${suffix}desc${hex.substring(0,4)}`;
        
        return derivedAddr;

    case 'getbalance':
       return calculateBalance(history);
    
    case 'getnewaddress':
       return currentAddress;

    case 'listaddressgroupings':
       // Simulate returning the active address and its balance
       // In a real scenario, this would group UTXOs by address
       const mainBalance = calculateBalance(history);
       return [{
           address: currentAddress,
           amount: mainBalance,
           label: "Primary"
       }];
    
    case 'getaddressinfo':
       // usage: getaddressinfo <address>
       const targetAddr = args[0] || currentAddress;
       if (!targetAddr) throw new Error("Usage: getaddressinfo <address>");

       const isTaproot = targetAddr.startsWith('tb1p') || targetAddr.startsWith('bc1p');

       return {
         address: targetAddr,
         scriptPubKey: isTaproot ? "5120" + Math.random().toString(16).substring(2).padEnd(60, '0') : "0014" + Math.random().toString(16).substring(2).padEnd(36, '0'),
         ismine: targetAddr === currentAddress,
         solvable: true,
         desc: isTaproot ? `tr(${targetAddr})#checksum` : `wpkh(${targetAddr})#checksum`,
         iswatchonly: false,
         isscript: false,
         iswitness: true,
         witness_version: isTaproot ? 1 : 0,
         witness_program: Math.random().toString(16).substring(2).padEnd(isTaproot ? 64 : 40, '0'),
         pubkey: "02" + Math.random().toString(16).substring(2).padEnd(64, '0'),
         ischange: false,
         timestamp: Math.floor(Date.now() / 1000),
         labels: targetAddr === currentAddress ? ["default"] : []
       };

    case 'listtransactions':
       // usage: listtransactions <dummy_account> <count=10> <skip=0>
       // Return newest first (reverse chronological)
       const count = args[1] ? parseInt(args[1]) : 10;
       const skip = args[2] ? parseInt(args[2]) : 0;
       
       const reversed = [...history].reverse();
       return reversed.slice(skip, skip + count);

    case 'listreceivedbyaddress':
       // usage: listreceivedbyaddress [minconf=1] [include_empty=false]
       const minconf = args.length > 0 ? parseInt(args[0]) : 1;
       const includeEmpty = args.length > 1 ? (args[1] === 'true') : false;

       const receivedTxs = history.filter(tx => 
          tx.type === TransactionType.RECEIVE && 
          (tx.confirmations || 0) >= minconf
       );

       const totalReceived = receivedTxs.reduce((sum, tx) => sum + tx.amount, 0);

       const result = [];
       if (totalReceived > 0 || includeEmpty) {
          result.push({
             address: currentAddress,
             amount: totalReceived,
             confirmations: 0,
             label: "default",
             txids: receivedTxs.map(tx => tx.id)
          });
       }
       return result;

    case 'sendtoaddress':
       if (args.length < 2) throw new Error("Usage: sendtoaddress <address> <amount>");
       
       const recipient = args[0];
       const amount = parseFloat(args[1]);
       
       if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
       
       const currentBal = calculateBalance(history);
       const fee = 0.000015;
       
       if (currentBal < amount + fee) {
         throw new Error(`Insufficient funds. Balance: ${currentBal.toFixed(8)}, Required: ${(amount + fee).toFixed(8)}`);
       }

       const nowSend = Date.now();
       const newTx: Transaction = {
         id: generateHash(),
         type: TransactionType.SEND,
         amount: amount,
         fiatValue: 0, 
         date: new Date(nowSend).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
         timestamp: nowSend,
         address: recipient,
         status: TransactionStatus.COMPLETED,
         fee: fee,
         confirmations: 0,
         inputs: [{ address: currentAddress, amount: amount + fee }],
         outputs: [{ address: recipient, amount: amount }]
       };

       history.push(newTx);
       saveHistory(network, currentAddress, history);
       return newTx.id;

    case 'generatetoaddress':
        const nBlocks = parseInt(args[0]) || 1;
        const rewardAddr = args[1] || currentAddress;
        const rewardAmount = 6.25 * nBlocks; 

        if (rewardAddr === currentAddress) {
            const nowGen = Date.now();
            const coinbasetx: Transaction = {
                id: generateHash(),
                type: TransactionType.RECEIVE,
                amount: rewardAmount,
                fiatValue: 0,
                date: new Date(nowGen).toLocaleDateString(),
                timestamp: nowGen,
                address: "coinbase",
                status: TransactionStatus.COMPLETED,
                confirmations: 1,
                fee: 0
            };
            history.push(coinbasetx);
            saveHistory(network, currentAddress, history);
            return [coinbasetx.id];
        }
        return [];

    case 'sendmany':
        let outputs = {};
        try {
            const jsonStr = args.slice(1).join(' '); 
            outputs = JSON.parse(jsonStr);
        } catch (e) {
            throw new Error("Invalid output map. Expected JSON object.");
        }

        const manyFee = 0.000015 * Object.keys(outputs).length;
        let totalSend = 0;
        for (const amt of Object.values(outputs)) {
            totalSend += Number(amt);
        }

        const balMany = calculateBalance(history);
        if (balMany < totalSend + manyFee) {
             throw new Error(`Insufficient funds for sendmany. Need ${(totalSend + manyFee).toFixed(8)}`);
        }

        const nowMany = Date.now();
        const sendManyTx: Transaction = {
            id: generateHash(),
            type: TransactionType.SEND,
            amount: totalSend,
            fiatValue: 0,
            date: new Date(nowMany).toLocaleDateString(),
            timestamp: nowMany,
            address: "Multiple Recipients",
            status: TransactionStatus.COMPLETED,
            fee: manyFee,
            confirmations: 0,
            inputs: [{ address: currentAddress, amount: totalSend + manyFee }],
            outputs: Object.entries(outputs).map(([addr, amt]) => ({ address: addr, amount: Number(amt) }))
        };
        
        history.push(sendManyTx);
        saveHistory(network, currentAddress, history);
        return sendManyTx.id;
    
    case 'getconnectioncount':
       return Math.floor(Math.random() * 5) + 8;

    case 'getblockchaininfo':
      return {
        chain: network === 'TESTNET' ? "test" : "main",
        blocks: network === 'TESTNET' ? 2578021 : 834120,
        headers: network === 'TESTNET' ? 2578021 : 834120,
        bestblockhash: "0000000000000000000182746c8f92j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9",
        difficulty: 72000000000000,
        mediantime: Math.floor(Date.now() / 1000),
        verificationprogress: 0.99999
      };

    // New simulated commands replacing hardcoded Console logic

    case 'listunspent':
        const unspentBalance = calculateBalance(history);
        if (unspentBalance <= 0) return [];
        return [
            { 
                txid: generateHash(), 
                vout: 0, 
                address: currentAddress, 
                amount: unspentBalance, 
                scriptPubKey: "76a914...", 
                confirmations: Math.floor(Math.random() * 100) + 6, 
                spendable: true, 
                solvable: true, 
                safe: true 
            }
        ];

    case 'getwalletinfo':
        return {
            walletname: network === 'TESTNET' ? "ZenithTest" : "ZenithMain",
            walletversion: 169900,
            format: "sqlite",
            balance: calculateBalance(history),
            unconfirmed_balance: 0.00000000,
            immature_balance: 0.00000000,
            txcount: history.length,
            keypoololdest: Math.floor(Date.now()/1000) - 86400,
            keypoolsize: 1000,
            hdseedid: "0000000000000000000000000000000000000000",
            private_keys_enabled: true,
            avoid_reuse: false,
            scanning: false,
            descriptor: true
        };

    case 'dumpwallet':
        if (!args[0]) throw new Error("Usage: dumpwallet <filename>");
        return { filename: args[0], warning: "This is a simulation. No file was actually written." };

    case 'encryptwallet':
        if (!args[0]) throw new Error("Usage: encryptwallet <passphrase>");
        return "wallet encrypted; The keypool has been flushed and a new one generated. The wallet is now locked.";

    case 'getblockcount':
        return network === 'TESTNET' ? 2578021 : 834120;

    case 'getbestblockhash':
        return "0000000000000000000182746c8f92j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9";

    case 'getblock':
        if (!args[0]) throw new Error("Usage: getblock <blockhash>");
        return {
            hash: args[0],
            confirmations: 1,
            size: 1523,
            weight: 4000,
            height: network === 'TESTNET' ? 2578021 : 834120,
            version: 536870912,
            merkleroot: generateHash(),
            tx: [generateHash(), generateHash()],
            time: Math.floor(Date.now() / 1000),
            nonce: 0,
            bits: "1d00ffff",
            difficulty: 1,
            chainwork: "0000000000000000000000000000000000000000000000000000000000000000",
            nTx: 2,
            previousblockhash: generateHash()
        };

    case 'getblockhash':
        if (!args[0]) throw new Error("Usage: getblockhash <height>");
        return generateHash();

    case 'createrawtransaction':
        return "0200000001" + generateHash();

    case 'decoderawtransaction':
        return {
            txid: generateHash(),
            hash: generateHash(),
            version: 2,
            size: 225,
            vsize: 144,
            weight: 573,
            locktime: 0,
            vin: [],
            vout: []
        };

    case 'signrawtransactionwithwallet':
        if (!args[0]) throw new Error("Usage: signrawtransactionwithwallet <hex>");
        return {
            hex: args[0] + "signed", 
            complete: true
        };

    case 'sendrawtransaction':
        if (!args[0]) throw new Error("Usage: sendrawtransaction <hex>");
        return generateHash();

    case 'getrawtransaction':
        if (!args[0]) throw new Error("Usage: getrawtransaction <txid>");
        return "02000000000101" + generateHash();

    case 'estimatesmartfee':
        return {
            feerate: 0.00001000,
            blocks: parseInt(args[0]) || 6
        };

    case 'validateaddress':
        if (!args[0]) throw new Error("Usage: validateaddress <address>");
        return {
            isvalid: true,
            address: args[0],
            scriptPubKey: "76a914...",
            isscript: false,
            iswitness: true
        };

    default:
       throw new Error(`Command not found: ${command}. Type "help" for a list of commands.`);
  }
};