export const DEFAULT_ADDRESS = 'tb1p90a7f3d12d4eaf03f2bcbff3b021ac6427c01d42435b3be5f43686c24e';
export const TESTNET_ADDRESS = DEFAULT_ADDRESS;
export const MAINNET_ADDRESS = DEFAULT_ADDRESS;

export type Network = 'MAINNET' | 'TESTNET';

export enum TransactionType {
  SEND = 'SEND',
  RECEIVE = 'RECEIVE'
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  FAILED = 'FAILED'
}

export interface TransactionInputOutput {
  address: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fiatValue: number;
  date: string;
  address: string;
  status: TransactionStatus;
  confirmations?: number;
  fee?: number;
  inputs?: TransactionInputOutput[];
  outputs?: TransactionInputOutput[];
}

export interface WalletState {
  btcBalance: number;
  fiatBalance: number;
  transactions: Transaction[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
  ADVISOR = 'ADVISOR',
  CLI = 'CLI'
}