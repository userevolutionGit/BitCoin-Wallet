
export const DEFAULT_ADDRESS = '';
export const TESTNET_ADDRESS = 'tb1ppksphu4jfv0watdurwzzlp9vstryak0mwz05xsqrza4xxp7e3hfs2w6cqj';
export const MAINNET_ADDRESS = '';
export const EXAMPLE_ADDRESS = 'tb1ppksphu4jfv0watdurwzzlp9vstryak0mwz05xsqrza4xxp7e3hfs2w6cqj';

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
  timestamp: number;
  address: string;
  status: TransactionStatus;
  confirmations?: number;
  fee?: number;
  inputs?: TransactionInputOutput[];
  outputs?: TransactionInputOutput[];
}

export interface AddressBalance {
  address: string;
  amount: number;
  label?: string;
}

export interface WalletState {
  btcBalance: number;
  fiatBalance: number;
  transactions: Transaction[];
  addressBalances: AddressBalance[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  network: Network;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
  ADVISOR = 'ADVISOR',
  CLI = 'CLI',
  AIRDROP = 'AIRDROP'
}