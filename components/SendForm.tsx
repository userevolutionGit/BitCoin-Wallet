import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Send as SendIcon, CheckCircle2, BookUser, Search, Plus, X, Trash2, User } from 'lucide-react';
import { analyzeTransactionRisk } from '../services/geminiService';
import { TESTNET_ADDRESS, MAINNET_ADDRESS, Network, Contact } from '../types';
import { executeBitcoinCli } from '../services/bitcoinCli';

interface SendFormProps {
  network: Network;
  currentAddress: string;
}

const STORAGE_KEY = 'zenith_wallet_contacts';

const SendForm: React.FC<SendFormProps> = ({ network, currentAddress }) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [riskReport, setRiskReport] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Address Book State
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');

  // Use the active address if available, otherwise fallback (for placeholder text)
  const currentPlaceholder = currentAddress || (network === 'TESTNET' ? TESTNET_ADDRESS : MAINNET_ADDRESS);

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

  const updateContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
  };

  const handleAddContact = () => {
    if (!newContactName || !newContactAddress) return;
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newContactName,
      address: newContactAddress,
      network
    };

    updateContacts([...contacts, newContact]);
    setNewContactName('');
    setNewContactAddress('');
    setIsAddingContact(false);
  };

  const handleDeleteContact = (id: string) => {
    updateContacts(contacts.filter(c => c.id !== id));
  };

  const handleSelectContact = (contactAddress: string) => {
    setAddress(contactAddress);
    setShowAddressBook(false);
  };

  const openAddressBook = () => {
    // If the user typed an address but hasn't saved it, pre-fill the add form
    if (address && !contacts.some(c => c.address === address)) {
        setNewContactAddress(address);
    } else {
        setNewContactAddress('');
    }
    setShowAddressBook(true);
  };

  const handleAnalyze = async () => {
    if (!address) return;
    setError('');
    setAnalyzing(true);
    const report = await analyzeTransactionRisk(address, Number(amount));
    setRiskReport(report);
    setAnalyzing(false);
    setStep('confirm');
  };

  const handleInitialConfirm = () => {
    setShowConfirmDialog(true);
  };

  const handleFinalBroadcast = async () => {
    setIsBroadcasting(true);
    try {
        await executeBitcoinCli('sendtoaddress', [address, amount], network, { address: currentAddress });
        setShowConfirmDialog(false);
        setStep('success');
    } catch (e: any) {
        setError(e.message || "Failed to broadcast transaction");
        setShowConfirmDialog(false);
    } finally {
        setIsBroadcasting(false);
    }
  };

  const reset = () => {
    setAddress('');
    setAmount('');
    setRiskReport(null);
    setStep('input');
    setShowConfirmDialog(false);
    setError('');
  };

  const filteredContacts = contacts.filter(c => 
    c.network === network && 
    (c.name.toLowerCase().includes(contactSearch.toLowerCase()) || 
     c.address.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Transaction Sent!</h2>
          <p className="text-slate-400">Your {amount} {network === 'TESTNET' ? 'tBTC' : 'BTC'} is on its way to the blockchain.</p>
        </div>
        <button 
          onClick={reset}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          Make Another Transfer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Send Bitcoin <span className="text-sm font-normal text-slate-400 ml-2">({network})</span></h2>
        
        {error && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-xl text-sm mb-4 flex items-center">
                <AlertTriangle className="mr-2 shrink-0" size={16} />
                {error}
            </div>
        )}

        {step === 'input' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Recipient Address</label>
              <div className="relative">
                <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={currentPlaceholder}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-600"
                />
                <button 
                    onClick={openAddressBook}
                    className="absolute right-3 top-3 text-slate-500 hover:text-amber-500 transition-colors p-1 rounded-md hover:bg-slate-800"
                    title="Address Book"
                >
                    <BookUser size={20} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Amount ({network === 'TESTNET' ? 'tBTC' : 'BTC'})</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00000000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <span className="absolute right-4 top-3.5 text-slate-500 font-medium">{network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!address || !amount || analyzing || !currentAddress}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {analyzing ? (
                <>
                  <ShieldCheck className="animate-pulse" />
                  <span>Scanning Address...</span>
                </>
              ) : (
                <span>{currentAddress ? 'Review Transaction' : 'Wallet Not Configured'}</span>
              )}
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-3">
                <ShieldCheck className="text-indigo-400 w-5 h-5" />
                <h3 className="font-semibold text-indigo-100">AI Risk Assessment</h3>
              </div>
              <div className="text-sm text-indigo-200/80 leading-relaxed">
                {/* Normally we'd render markdown, but simpler text here */}
                {riskReport?.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">To</span>
                <span className="text-slate-200 font-mono text-xs break-all pl-4">{address}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="text-amber-500 font-bold">{amount} {network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Network Fee</span>
                <span className="text-slate-200">0.000015 {network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-white">{(Number(amount) + 0.000015).toFixed(6)} {network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => setStep('input')}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleInitialConfirm}
                className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <SendIcon size={18} />
                <span>Confirm Send</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal Overlay */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
             
             <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Broadcast</h3>
                <p className="text-slate-400 text-sm">
                  You are about to send <span className="text-white font-bold">{amount} {network === 'TESTNET' ? 'tBTC' : 'BTC'}</span>. 
                  This action is irreversible.
                </p>
             </div>

             <div className="bg-slate-950/50 rounded-lg p-4 mb-6 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Recipient</span>
                </div>
                <div className="text-sm font-mono text-slate-300 break-all mb-3">
                  {address}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Total Deducted</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {(Number(amount) + 0.000015).toFixed(6)} {network === 'TESTNET' ? 'tBTC' : 'BTC'}
                </div>
             </div>

             <div className="flex space-x-3">
               <button 
                 onClick={() => setShowConfirmDialog(false)}
                 disabled={isBroadcasting}
                 className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors disabled:opacity-50"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleFinalBroadcast}
                 disabled={isBroadcasting}
                 className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50 flex justify-center"
               >
                 {isBroadcasting ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : "Broadcast Now"}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Address Book Modal */}
      {showAddressBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
              <h3 className="font-bold text-white flex items-center">
                <BookUser className="mr-2 text-amber-500" size={20} />
                Address Book
              </h3>
              <button onClick={() => setShowAddressBook(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <p>No contacts found for {network}.</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-800/50 transition-colors group">
                    <div 
                        className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleSelectContact(contact.address)}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-slate-200 truncate">{contact.name}</h4>
                        <p className="text-xs text-slate-500 truncate font-mono">{contact.address}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-800/50 border-t border-slate-800 rounded-b-2xl">
              {!isAddingContact ? (
                <button 
                  onClick={() => setIsAddingContact(true)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium border border-dashed border-slate-600 hover:border-slate-500 flex items-center justify-center transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Add New Contact
                </button>
              ) : (
                <div className="space-y-3 animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-semibold text-slate-400 uppercase">New Contact</span>
                     <button onClick={() => setIsAddingContact(false)} className="text-xs text-slate-500 hover:text-white">Cancel</button>
                  </div>
                  <input 
                    type="text" 
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Name (e.g. Alice)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    autoFocus
                  />
                  <input 
                    type="text" 
                    value={newContactAddress}
                    onChange={(e) => setNewContactAddress(e.target.value)}
                    placeholder="Address (bc1q...)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none font-mono"
                  />
                  <button 
                    onClick={handleAddContact}
                    disabled={!newContactName || !newContactAddress}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-lg text-sm transition-colors"
                  >
                    Save Contact
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendForm;