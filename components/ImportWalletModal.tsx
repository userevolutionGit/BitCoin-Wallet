import React, { useState } from 'react';
import { KeyRound, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ImportWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (seed: string) => void;
}

const ImportWalletModal: React.FC<ImportWalletModalProps> = ({ isOpen, onClose, onImport }) => {
  const [seed, setSeed] = useState('');
  const [error, setError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    const words = seed.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must contain exactly 12 or 24 words.');
      return;
    }

    setError('');
    setIsSimulating(true);
    
    // Simulate derivation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onImport(seed);
    setIsSimulating(false);
    setSeed('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="bg-amber-500/10 p-2 rounded-lg">
                <KeyRound className="text-amber-500 w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white">Import Wallet</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
           <div className="bg-amber-900/20 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-amber-200/80">
                Enter your 12 or 24-word recovery phrase. In this simulation, this will deterministically generate a unique wallet address for you.
              </p>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-400 mb-2">Recovery Phrase</label>
             <textarea 
               value={seed}
               onChange={(e) => setSeed(e.target.value)}
               className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none font-mono text-sm"
               placeholder="witch collapse practice feed shame open despair creek road again ice least"
             />
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
             onClick={handleImport}
             disabled={!seed || isSimulating}
             className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center space-x-2"
           >
             {isSimulating ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <span>Deriving Keys...</span>
               </>
             ) : (
               <span>Import Wallet</span>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ImportWalletModal;