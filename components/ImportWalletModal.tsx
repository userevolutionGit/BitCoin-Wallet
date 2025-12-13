import React, { useState } from 'react';
import { KeyRound, X, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Copy, Check } from 'lucide-react';

interface ImportWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (seed: string) => void;
}

// Small subset of BIP39 words for simulation
const MOCK_WORD_LIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar',
  'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal',
  'dad', 'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day',
  'early', 'earn', 'earth', 'easily', 'east', 'easy', 'echo', 'ecology', 'economy', 'edge',
  'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall', 'false', 'fame', 'family',
  'galaxy', 'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas'
];

const ImportWalletModal: React.FC<ImportWalletModalProps> = ({ isOpen, onClose, onImport }) => {
  const [seed, setSeed] = useState('');
  const [error, setError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const validateSeed = (phrase: string): boolean => {
    // Filter out empty strings from multiple spaces
    const words = phrase.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length === 12 || words.length === 24;
  };

  const handleAction = async () => {
    if (!validateSeed(seed)) {
      setError('Seed phrase must contain exactly 12 or 24 words.');
      return;
    }

    setError('');
    setIsSimulating(true);
    
    // Simulate key derivation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onImport(seed);
    resetState();
    onClose();
  };

  const handleGenerateSeed = () => {
    // Pick 12 random words
    const newWords = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * MOCK_WORD_LIST.length);
      newWords.push(MOCK_WORD_LIST[randomIndex]);
    }
    const newSeed = newWords.join(' ');
    setSeed(newSeed);
    setIsGenerated(true);
    setError('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(seed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetState = () => {
    setIsSimulating(false);
    setIsGenerated(false);
    setSeed('');
    setError('');
  };

  const isValid = validateSeed(seed);
  const wordCount = seed.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="bg-amber-500/10 p-2 rounded-lg">
                <KeyRound className="text-amber-500 w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white">Import | Create Wallet</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
           <div className={`border rounded-xl p-4 flex items-start space-x-3 ${
             isGenerated ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-amber-900/20 border-amber-500/20'
           }`}>
              {isGenerated ? (
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              ) : (
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              )}
              <p className={`text-sm ${isGenerated ? 'text-emerald-200/80' : 'text-amber-200/80'}`}>
                {isGenerated 
                  ? "New seed generated successfully. Please write this down or save it securely immediately."
                  : "Enter your 12 or 24-word recovery phrase, or generate a new one to create a wallet."
                }
              </p>
           </div>

           <div>
             <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-400">Recovery Phrase</label>
                <div className="flex space-x-2">
                    {seed && (
                        <button 
                            onClick={handleCopy}
                            className="text-xs flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
                        >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                    )}
                    <button 
                        onClick={handleGenerateSeed}
                        className="text-xs flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <RefreshCw size={12} />
                        <span>Generate New</span>
                    </button>
                </div>
             </div>
             <div className="relative">
                <textarea 
                value={seed}
                onChange={(e) => {
                    setSeed(e.target.value);
                    setIsGenerated(false);
                    if (error) setError('');
                }}
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                placeholder="witch collapse practice feed shame open despair creek road again ice least"
                />
                {isValid && (
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md border border-slate-700">
                        <span className="text-emerald-500 text-xs flex items-center font-medium">
                            <CheckCircle2 size={12} className="mr-1" />
                            Valid ({wordCount} words)
                        </span>
                    </div>
                )}
             </div>
             {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
           </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex space-x-3">
           <button 
             onClick={onClose}
             className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
           >
             Cancel
           </button>
           
           <button 
             onClick={handleGenerateSeed}
             className="px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
           >
                <Sparkles size={18} />
                <span className="hidden sm:inline">Generate</span>
           </button>

           <button 
             onClick={handleAction}
             disabled={!seed || isSimulating || !isValid}
             className={`flex-[2] px-4 py-3 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                 isGenerated 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-900/20' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-900/20'
             }`}
           >
             {isSimulating ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <span>{isGenerated ? 'Creating Wallet...' : 'Importing...'}</span>
               </>
             ) : (
               <span>{isGenerated ? 'Create Wallet' : 'Import Wallet'}</span>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ImportWalletModal;