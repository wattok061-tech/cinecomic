
import React from 'react';

interface PricingModalProps {
  onClose: () => void;
  credits: number;
  displayedCredits: number;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, credits, displayedCredits }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-10 bg-black/95 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-white border-4 md:border-[12px] border-black p-4 sm:p-8 md:p-16 max-w-6xl w-full shadow-[10px_10px_0px_#be123c] md:shadow-[50px_50px_0px_#be123c] rounded-[1.5rem] md:rounded-[4rem] relative my-4 sm:my-auto">
        <button 
          onClick={onClose} 
          className="fixed sm:absolute top-2 right-2 sm:-top-10 sm:-right-10 bg-rose-700 text-white w-10 h-10 sm:w-20 sm:h-20 border-2 sm:border-8 border-black comic-font text-xl sm:text-6xl flex items-center justify-center shadow-[3px_3px_0px_#000] sm:shadow-[10px_10px_0px_#000] hover:scale-110 transition-all z-[110]"
        >
          X
        </button>
        
        <div className="text-center mb-6 md:mb-16 mt-6 sm:mt-0">
          <h2 className="comic-font text-5xl sm:text-7xl md:text-[10rem] text-black leading-none mb-2 sm:mb-4 uppercase italic drop-shadow-[4px_4px_0px_#fbbf24]">INK VAULT</h2>
          <div className="inline-block bg-black text-white px-8 py-2 md:py-4 rounded-full border-4 border-amber-400 -rotate-2 shadow-2xl">
             <p className="text-sm md:text-3xl font-black uppercase italic tracking-widest">
               ACTIVE RESERVES: <span className="text-amber-400">{displayedCredits}</span> CORES
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10 mb-8 md:mb-16">
          {[
            { name: "STARTER", price: 9, credits: 300, color: "bg-zinc-50" },
            { name: "PRO", price: 19, credits: 1000, color: "bg-amber-50", featured: true },
            { name: "STUDIO", price: 49, credits: 3000, color: "bg-zinc-900", dark: true }
          ].map((plan) => (
            <div key={plan.name} className={`p-6 md:p-10 border-4 border-black rounded-[2rem] md:rounded-[3rem] space-y-4 md:space-y-6 hover:scale-105 transition-all shadow-xl relative overflow-hidden group ${plan.color} ${plan.featured ? 'ring-8 ring-amber-400' : ''}`}>
              <div className="absolute inset-0 halftone opacity-5 group-hover:opacity-15 pointer-events-none transition-opacity"></div>
              {plan.featured && (
                <div className="absolute top-4 right-4 bg-rose-700 text-white px-4 py-1 font-black uppercase text-[8px] md:text-xs rotate-12 shadow-lg border-2 border-black z-10">RECOMMENDED</div>
              )}
              <h3 className={`comic-font text-3xl md:text-5xl ${plan.dark ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
              <p className={`text-4xl md:text-7xl font-black ${plan.dark ? 'text-amber-400' : 'text-rose-700'}`}>${plan.price}<span className="text-sm md:text-lg opacity-50">/MO</span></p>
              <div className={`h-1 w-full ${plan.dark ? 'bg-zinc-800' : 'bg-black/10'} rounded-full`}></div>
              <ul className={`space-y-2 font-black text-[10px] md:text-sm uppercase ${plan.dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li className="flex items-center gap-2"><i className="fas fa-bolt text-amber-400"></i> {plan.credits} Monthly Cores</li>
                <li className="flex items-center gap-2"><i className="fas fa-eye text-amber-400"></i> No Watermark</li>
                <li className="flex items-center gap-2"><i className="fas fa-palette text-amber-400"></i> High-Res Protocols</li>
              </ul>
              <button className={`w-full py-3 md:py-5 font-black uppercase text-sm md:text-xl rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] transition-all hover:translate-y-[-4px] active:translate-y-0
                ${plan.dark ? 'bg-white text-black hover:bg-amber-400' : 'bg-black text-white hover:bg-rose-700'}`}>
                ACTIVATE LINK
              </button>
            </div>
          ))}
        </div>

        <div className="border-t-8 border-black pt-12 text-center">
          <h3 className="comic-font text-3xl md:text-6xl text-black mb-8 uppercase italic">EMERGENCY RESERVES</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { amount: 50, price: 5 },
              { amount: 200, price: 15 },
              { amount: 500, price: 30 },
              { amount: 2000, price: 100 }
            ].map(pack => (
              <button 
                key={pack.amount} 
                className="group p-4 md:p-8 border-4 border-black rounded-[1.5rem] md:rounded-[2.5rem] hover:bg-rose-700 hover:text-white transition-all text-center relative overflow-hidden bg-white shadow-lg active:translate-y-1"
              >
                <div className="absolute inset-0 halftone opacity-0 group-hover:opacity-10 pointer-events-none"></div>
                <p className="comic-font text-lg md:text-3xl uppercase leading-none">{pack.amount} CORES</p>
                <p className="text-2xl md:text-4xl font-black mt-1">$ {pack.price}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
