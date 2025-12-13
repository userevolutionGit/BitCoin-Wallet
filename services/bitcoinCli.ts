import { Network, Transaction, TransactionType, TransactionStatus } from '../types';

interface WalletContext {
  address: string;
}

// In-memory store for simulation (Session persistence)
// Key: "NETWORK:ADDRESS", Value: Transaction[]
const TX_STORE: Record<string, Transaction[]> = {};

// Initial mock data generator (used only once per address)
const generateInitialHistory = (address: string, network: Network): Transaction[] => {
  const commonProps = {
    confirmations: network === 'TESTNET' ? 120 : 6,
    fee: 0.000015
  };

  if (address.startsWith('tb1p90') || address.startsWith('bc1q')) {
     // Only give "genesis" funds to the simulated default/imported addresses
     // to allow testing immediately.
     const txId = Math.random().toString(36).substring(7);
     return [
      {
        id: txId,
        type: TransactionType.RECEIVE,
        amount: network === 'TESTNET' ? 1.25 : 0.05,
        fiatValue: 0,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        address: address,
        status: TransactionStatus.COMPLETED,
        ...commonProps,
        inputs: [],
        outputs: [{ address: address, amount: network === 'TESTNET' ? 1.25 : 0.05 }]
      }
    ];
  }
  return [];
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
  // Don't execute wallet commands without an address
  if (!currentAddress && ['getbalance', 'sendtoaddress', 'listtransactions', 'generatetoaddress', 'sendmany'].includes(command.toLowerCase())) {
     throw new Error("No wallet loaded. Please import or create a wallet.");
  }

  const history = currentAddress ? getHistory(network, currentAddress) : [];

  switch (command.toLowerCase()) {
    case 'getbalance':
       return calculateBalance(history);
    
    case 'getnewaddress':
       // In a real node, this generates a new one. Here we return current or a new fake one.
       // For this simulation, we'll simply return the current to keep things simple, 
       // or generate a random one if they want to 'switch' (but App state controls active addr).
       return currentAddress;

    case 'listtransactions':
       // Return copy sorted by newest first
       return [...history].reverse();

    case 'sendtoaddress':
       // usage: sendtoaddress <address> <amount>
       if (args.length < 2) throw new Error("Usage: sendtoaddress <address> <amount>");
       
       const recipient = args[0];
       const amount = parseFloat(args[1]);
       
       if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
       
       const currentBal = calculateBalance(history);
       const fee = 0.000015;
       
       if (currentBal < amount + fee) {
         throw new Error(`Insufficient funds. Balance: ${currentBal.toFixed(8)}, Required: ${(amount + fee).toFixed(8)}`);
       }

       const newTx: Transaction = {
         id: Math.random().toString(36).substring(2, 10),
         type: TransactionType.SEND,
         amount: amount,
         fiatValue: 0, // Calculated in UI
         date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
         address: recipient,
         status: TransactionStatus.COMPLETED, // Simulating instant confirmation for UX
         fee: fee,
         confirmations: 0,
         inputs: [{ address: currentAddress, amount: amount + fee }],
         outputs: [{ address: recipient, amount: amount }]
       };

       history.push(newTx);
       saveHistory(network, currentAddress, history);
       return newTx.id;

    case 'generatetoaddress':
        // usage: generatetoaddress <nblocks> <address>
        // Use this to add funds in simulation
        const nBlocks = parseInt(args[0]) || 1;
        const rewardAddr = args[1] || currentAddress;
        
        // Block reward simulation (e.g. 50 BTC regtest style, or small for testnet)
        const rewardAmount = 6.25 * nBlocks; 

        // We only add to history if it matches our current context for this simple app
        // (Since we don't strictly separate wallet vs node, we just add a RECEIVE tx)
        if (rewardAddr === currentAddress) {
            const coinbasetx: Transaction = {
                id: Math.random().toString(36).substring(2, 10),
                type: TransactionType.RECEIVE,
                amount: rewardAmount,
                fiatValue: 0,
                date: new Date().toLocaleDateString(),
                address: "coinbase",
                status: TransactionStatus.COMPLETED,
                confirmations: 1,
                fee: 0
            };
            history.push(coinbasetx);
            saveHistory(network, currentAddress, history);
            return [coinbasetx.id]; // CLI returns list of hashes
        }
        return [];

    case 'sendmany':
        // usage: sendmany "" {"address": amount, ...}
        // args[0] is account (ignored/empty), args[1] is JSON string or object
        // In console user types: sendmany "" {"tb1...": 0.1, "tb1...": 0.2}
        // Arguments coming from Console might be split by spaces, so parsing JSON is tricky if done simply.
        // But our Airdrop component passes an object directly if we allow it, 
        // OR we stringify it. The `executeBitcoinCli` signature says `args: string[]`.
        // We will assume Airdrop component passes [ "", JSON.stringify(map) ]
        
        let outputs = {};
        try {
            // Join back if it was split by spaces erroneously by caller, or expect correct entry
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

        // Create one large transaction or many small ones? 
        // sendmany creates one TX with multiple outputs.
        const sendManyTx: Transaction = {
            id: Math.random().toString(36).substring(2, 10),
            type: TransactionType.SEND,
            amount: totalSend,
            fiatValue: 0,
            date: new Date().toLocaleDateString(),
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

    default:
       // Fallback for visual commands that don't need state
       return null;
  }
};