
import React from 'react';

interface PricingModalProps {
  onClose: () => void;
  credits: number;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, credits }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-10 bg-black/95 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-white border-4 md:border-[12px] border-black p-4 sm:p-8 md:p-16 max-w-6xl w-full shadow-[10px_10px_0px_#be123c] md:shadow-[50px_50px_0px_#be123c] rounded-[1.5rem] md:rounded-[4rem] relative my-4 sm:my-auto">
        <button onClick={onClose} className="fixed sm:absolute top-2 right-2 sm:-top-10 sm:-right-10 bg-rose-700 text-white w-10 h-10 sm:w-20 sm:h-20 border-2 sm:border-8 border-black comic-font text-xl sm:text-6xl flex items-center justify-center shadow-[3px_3px_0px_#000] sm:shadow-[10px_10px_0px_#000] hover:scale-110 transition-all z-[110]">X</button>
        
        <div className="text-center mb-6 md:mb-16 mt-6 sm:mt-0">
          <h2 className="comic-font text-4xl sm:text-6xl md:text-[8rem] text-black leading-none mb-2 sm:mb-4 uppercase">INK VAULT</h2>
          <p className="text-[10px] sm:text-xl md:text-2xl font-black uppercase italic tracking-widest text-zinc-500">Current Balance: {credits} Cores</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10 mb-8 md:mb-16">
          <div className="p-5 md:p-10 border-2 md:border-4 border-black rounded-xl md:rounded-[3rem] space-y-3 md:space-y-6 hover:translate-y-[-5px] transition-all bg-zinc-50">
            <h3 className="comic-font text-2xl md:text-5xl text-black">STARTER</h3>
            <p className="text-3xl md:text-6xl font-black text-rose-700">$9<span className="text-sm">/mo</span></p>
            <ul className="space-y-1 font-bold text-[8px] md:text-sm uppercase">
              <li>300 Monthly Credits</li>
              <li>No Watermark</li>
              <li>Standard Styles</li>
            </ul>
            <button className="w-full py-2 md:py-4 bg-black text-white font-black uppercase text-xs md:text-base rounded-lg md:rounded-2xl hover:bg-rose-700 transition-all">SUBSCRIBE</button>
          </div>
          <div className="p-5 md:p-10 border-2 md:border-4 border-black rounded-xl md:rounded-[3rem] space-y-3 md:space-y-6 hover:translate-y-[-5px] transition-all bg-amber-50 relative ring-2 md:ring-8 ring-amber-400">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 md:px-6 py-0.5 md:py-1 font-black uppercase text-[7px] md:text-xs whitespace-nowrap">MOST POPULAR</div>
            <h3 className="comic-font text-2xl md:text-5xl text-black">PRO</h3>
            <p className="text-3xl md:text-6xl font-black text-rose-700">$19<span className="text-sm">/mo</span></p>
            <ul className="space-y-1 font-bold text-[8px] md:text-sm uppercase">
              <li>1,000 Monthly Credits</li>
              <li>All Protocols</li>
              <li>Character Sync</li>
            </ul>
            <button className="w-full py-2 md:py-4 bg-black text-white font-black uppercase text-xs md:text-base rounded-lg md:rounded-2xl hover:bg-rose-700 transition-all">SUBSCRIBE</button>
          </div>
          <div className="p-5 md:p-10 border-2 md:border-4 border-black rounded-xl md:rounded-[3rem] space-y-3 md:space-y-6 hover:translate-y-[-5px] transition-all bg-zinc-900 text-white">
            <h3 className="comic-font text-2xl md:text-5xl">STUDIO</h3>
            <p className="text-3xl md:text-6xl font-black text-amber-400">$49<span className="text-sm">/mo</span></p>
            <ul className="space-y-1 font-bold text-[8px] md:text-sm uppercase">
              <li>3,000 Monthly Credits</li>
              <li>Team Access</li>
              <li>Priority Inking</li>
            </ul>
            <button className="w-full py-2 md:py-4 bg-white text-black font-black uppercase text-xs md:text-base rounded-lg md:rounded-2xl hover:bg-amber-400 transition-all">SUBSCRIBE</button>
          </div>
        </div>

        <div className="border-t-2 md:border-t-4 border-black pt-6 md:pt-16">
          <h3 className="comic-font text-2xl sm:text-3xl md:text-5xl text-center mb-4 md:mb-10 uppercase">TOP UP</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
            {[
              { amount: 50, price: 5 },
              { amount: 200, price: 15 },
              { amount: 500, price: 30 },
              { amount: 2000, price: 100 }
            ].map(pack => (
              <button key={pack.amount} className="p-2 sm:p-4 md:p-6 border md:border-4 border-black rounded-lg md:rounded-3xl hover:bg-zinc-50 transition-all text-center">
                <p className="comic-font text-xs sm:text-lg md:text-2xl">{pack.amount} CORES</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-black text-rose-700">${pack.price}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
