import { Network, Transaction, TransactionType, TransactionStatus } from '../types';

interface WalletContext {
  address: string;
}

const generateMockTxs = (address: string, network: Network): Transaction[] => {
  if (network === 'TESTNET') {
    return [
      {
        id: 'tx1',
        type: TransactionType.RECEIVE,
        amount: 0.00125000,
        fiatValue: 0,
        date: 'Dec 10, 2025',
        address: address,
        status: TransactionStatus.COMPLETED
      },
      {
        id: 'tx2',
        type: TransactionType.SEND,
        amount: 0.00050000,
        fiatValue: 0,
        date: 'Dec 8, 2025',
        address: address,
        status: TransactionStatus.COMPLETED
      },
      {
        id: 'tx3',
        type: TransactionType.RECEIVE,
        amount: 0.05000000,
        fiatValue: 0,
        date: 'Dec 5, 2025',
        address: address,
        status: TransactionStatus.COMPLETED
      }
    ];
  } else {
    return [
      {
        id: 'mx1',
        type: TransactionType.RECEIVE,
        amount: 0.02500000,
        fiatValue: 0,
        date: 'Dec 12, 2025',
        address: address,
        status: TransactionStatus.COMPLETED
      },
      {
        id: 'mx2',
        type: TransactionType.SEND,
        amount: 0.00100000,
        fiatValue: 0,
        date: 'Dec 11, 2025',
        address: address,
        status: TransactionStatus.PENDING
      }
    ];
  }
};

export const executeBitcoinCli = async (
  command: string, 
  args: string[], 
  network: Network,
  context?: WalletContext
): Promise<any> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 300));

  // Use provided address or fallback (though App should always provide one now)
  const currentAddress = context?.address || 'unknown-address';

  switch (command.toLowerCase()) {
    case 'getbalance':
       // Return deterministic balance based on address characters to simulate different wallets having different balances
       const seed = currentAddress.charCodeAt(currentAddress.length - 1) + currentAddress.charCodeAt(0);
       const baseBalance = network === 'TESTNET' ? 1.24503211 : 0.05234891;
       // If it's the default address, return standard mock balance, else generate a "new wallet" balance
       return currentAddress.startsWith('tb1p90') ? baseBalance : (seed % 100) / 100 + 0.001;
    
    case 'getnewaddress':
       return currentAddress;

    case 'listtransactions':
       return generateMockTxs(currentAddress, network);
    
    case 'getconnectioncount':
       return Math.floor(Math.random() * 5) + 8; // Random peer count 8-12

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
       return null;
  }
};