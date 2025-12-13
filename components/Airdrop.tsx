import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Check, Send, AlertTriangle, Search, UserPlus, CheckCircle2, Copy } from 'lucide-react';
import { Network, Contact } from '../types';
import { executeBitcoinCli } from '../services/bitcoinCli';

interface AirdropProps {
  network: Network;
  currentAddress: string;
}

const STORAGE_KEY = 'zenith_wallet_contacts';

const Airdrop: React.FC<AirdropProps> = ({ network, currentAddress }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amountPerPerson, setAmountPerPerson] = useState('');
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [successStep, setSuccessStep] = useState(false);
  const [error, setError] = useState('');

  // Load contacts on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse contacts", e);
      }
    }
  }, []);

  // Save contacts on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  const handleAddContact = () => {
    if (!newName || !newAddress) return;
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newName,
      address: newAddress,
      network
    };

    setContacts(prev => [...prev, newContact]);
    setNewName('');
    setNewAddress('');
    setIsAdding(false);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleExecuteAirdrop = async () => {
    if (!currentAddress) {
        setError("Wallet not configured");
        return;
    }
    setError('');
    setIsProcessing(true);
    
    try {
        const recipients: Record<string, number> = {};
        filteredContacts.forEach(c => {
            if (selectedIds.has(c.id)) {
                recipients[c.address] = parseFloat(amountPerPerson);
            }
        });

        // Use sendmany command simulation
        await executeBitcoinCli(
            'sendmany', 
            ["", JSON.stringify(recipients)], 
            network, 
            { address: currentAddress }
        );

        setIsProcessing(false);
        setSuccessStep(true);
    } catch (e: any) {
        setError(e.message || "Failed to broadcast airdrop");
        setIsProcessing(false);
    }
  };

  const resetAirdrop = () => {
    setSuccessStep(false);
    setAmountPerPerson('');
    setSelectedIds(new Set());
    setError('');
  };

  const filteredContacts = contacts.filter(c => c.network === network);
  const totalAmount = (Number(amountPerPerson) * selectedIds.size).toFixed(8);

  if (successStep) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-fade-in bg-slate-800/30 rounded-2xl border border-emerald-500/20">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Airdrop Complete!</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Successfully broadcasted transactions to <span className="text-white font-bold">{selectedIds.size}</span> recipients.
            <br/>Total: <span className="text-emerald-400 font-mono">{totalAmount} {network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>
          </p>
        </div>
        <button 
          onClick={resetAirdrop}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
        >
          Start New Airdrop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
                <Users className="text-purple-400 w-6 h-6" />
            </div>
            <span>Airdrop Manager</span>
            <span className="text-sm font-normal text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{network}</span>
        </h2>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium"
        >
            <UserPlus size={16} />
            <span>Add Friend</span>
        </button>
      </div>

      {/* Add Friend Form */}
      {isAdding && (
        <div className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-6 animate-in slide-in-from-top-4">
            <h3 className="text-white font-semibold mb-4 flex items-center">
                <Plus size={16} className="mr-2 text-indigo-400"/>
                Add New Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Name / Label</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Satoshi Nakamoto"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Wallet Address ({network})</label>
                    <input 
                        type="text" 
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="bc1q..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-3">
                <button 
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleAddContact}
                    disabled={!newName || !newAddress}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Save Contact
                </button>
            </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-xl text-sm flex items-center">
            <AlertTriangle className="mr-2 shrink-0" size={16} />
            {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact List */}
        <div className="lg:col-span-2 bg-slate-800/30 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
             <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
                        onChange={toggleAll}
                        className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-sm font-medium text-slate-300">Select All ({filteredContacts.length})</span>
                </div>
                <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1.5 text-slate-500 w-4 h-4" />
                    <input type="text" placeholder="Search friends..." className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1 text-sm text-slate-300 focus:border-indigo-500 outline-none w-48" />
                </div>
             </div>
             
             <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                {filteredContacts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Users size={48} className="mb-4 opacity-20" />
                        <p>No contacts found for {network}.</p>
                        <button onClick={() => setIsAdding(true)} className="text-indigo-400 hover:text-indigo-300 text-sm mt-2">Add your first friend</button>
                    </div>
                ) : (
                    filteredContacts.map(contact => (
                        <div 
                            key={contact.id}
                            onClick={() => toggleSelection(contact.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                selectedIds.has(contact.id) 
                                ? 'bg-indigo-500/10 border-indigo-500/50' 
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center space-x-4 overflow-hidden">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    selectedIds.has(contact.id) ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {selectedIds.has(contact.id) ? <Check size={18} /> : <span className="font-bold">{contact.name.charAt(0)}</span>}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`text-sm font-medium truncate ${selectedIds.has(contact.id) ? 'text-indigo-200' : 'text-slate-200'}`}>{contact.name}</h4>
                                    <p className="text-xs font-mono text-slate-500 truncate">{contact.address}</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                                className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
             </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                 
                 <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <Send className="w-5 h-5 mr-2 text-purple-400" />
                    Airdrop Settings
                 </h3>

                 <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-400">Recipients</label>
                            <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full">{selectedIds.size}</span>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden py-1">
                            {Array.from(selectedIds).slice(0, 5).map(id => (
                                <div key={id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-white">
                                    {filteredContacts.find(c => c.id === id)?.name.charAt(0)}
                                </div>
                            ))}
                            {selectedIds.size > 5 && (
                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs text-slate-400">
                                    +{selectedIds.size - 5}
                                </div>
                            )}
                            {selectedIds.size === 0 && <span className="text-sm text-slate-600 italic">No contacts selected</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Amount per person</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={amountPerPerson}
                                onChange={(e) => setAmountPerPerson(e.target.value)}
                                placeholder="0.00000000"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono"
                            />
                            <span className="absolute right-4 top-3.5 text-slate-500 font-medium text-sm">{network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-700/50">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-sm">Total Required</span>
                            <span className="text-slate-500 text-xs">(Excl. fees)</span>
                        </div>
                        <div className="text-2xl font-bold text-white truncate">
                            {totalAmount} <span className="text-sm text-slate-500 font-normal">{network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleExecuteAirdrop}
                        disabled={selectedIds.size === 0 || !amountPerPerson || Number(amountPerPerson) <= 0 || isProcessing || !currentAddress}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center space-x-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Broadcasting...</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>Execute Airdrop</span>
                            </>
                        )}
                    </button>
                    {selectedIds.size === 0 && <p className="text-xs text-center text-slate-500">Select at least one contact to proceed</p>}
                    {!currentAddress && <p className="text-xs text-center text-rose-500">Create wallet to send funds</p>}
                 </div>
            </div>
            
            <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                    Airdrops are executed as batched transactions where possible to save on network fees. Ensure you have sufficient balance for the total amount plus mining fees.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Airdrop;