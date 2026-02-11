
import React from 'react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const content = {
    terms: {
      title: "TERMS OF SERVICE",
      sections: [
        {
          h: "1. MISSION ENROLLMENT",
          p: "By accessing the CineComic AI Protocol, you agree to follow the rules of engagement. You must be at least 13 solar cycles old to operate this engine."
        },
        {
          h: "2. INTELLECTUAL CARGO",
          p: "Users retain the soul of their original video uploads. CineComic AI claims ownership over the specific neural patterns (AI generated art) used to redraw your footage, though we grant you a perpetual license for personal use and distribution of the resulting comics."
        },
        {
          h: "3. CORE CURRENCY",
          p: "Energy Cores are non-refundable tokens of the multiverse. Subscription renewals happen automatically unless you deactivate your link in the vault."
        },
        {
          h: "4. CODE OF CONDUCT",
          p: "Any attempt to inject malicious scripts, scrape the archive, or use the engine for prohibited propaganda will result in immediate link termination."
        }
      ]
    },
    privacy: {
      title: "PRIVACY POLICY",
      sections: [
        {
          h: "1. DATA HARVESTING",
          p: "We collect your digital identifier (email) and hero name to maintain your vault. Video assets are temporarily buffered in the cloud for neural analysis and are purged within 24 hours of successful mission completion."
        },
        {
          h: "2. NEURAL TRAINING",
          p: "We do not use your personal video data to train the core engine. Your style preferences help us optimize the Art Protocols for future recruits."
        },
        {
          h: "3. MULTIVERSE SHARING",
          p: "CineComic AI never sells your data to rogue syndicates. We only share data with verified partners required for billing and AI processing (Google, Stripe)."
        },
        {
          h: "4. YOUR COMMAND",
          p: "You have the right to request a full wipe of your data at any time. Contact the Architect via the Feedback channel."
        }
      ]
    }
  }[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-white border-4 md:border-[12px] border-black p-8 md:p-20 max-w-4xl w-full shadow-[20px_20px_0px_#be123c] rounded-[2rem] md:rounded-[4rem] relative my-10 animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute -top-4 -right-4 md:-top-10 md:-right-10 bg-black text-white w-12 h-12 md:w-20 md:h-20 border-4 md:border-8 border-white rounded-full comic-font text-2xl md:text-5xl flex items-center justify-center shadow-xl hover:scale-110 transition-all">X</button>
        
        <div className="text-center mb-10 md:mb-16">
          <h2 className="comic-font text-5xl md:text-8xl text-black uppercase italic leading-none">{content.title}</h2>
          <div className="h-2 w-24 bg-rose-700 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="space-y-8 md:space-y-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          {content.sections.map((s, i) => (
            <div key={i} className="space-y-3">
              <h3 className="comic-font text-2xl md:text-4xl text-black uppercase italic tracking-tighter">{s.h}</h3>
              <p className="text-zinc-600 font-bold text-xs md:text-lg leading-relaxed uppercase tracking-wide">{s.p}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <button onClick={onClose} className="bg-black text-white px-10 py-4 comic-font text-2xl border-4 border-black hover:bg-rose-700 transition-all uppercase italic shadow-[4px_4px_0px_#000]">ACKNOWLEDGED</button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
