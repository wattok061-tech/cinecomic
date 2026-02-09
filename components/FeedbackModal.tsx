
import React, { useState } from 'react';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSubmit }) => {
  const [text, setText] = useState('');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <div className="bg-white border-4 md:border-8 border-black p-6 sm:p-10 md:p-16 max-w-2xl w-full rounded-[2rem] md:rounded-[4rem] shadow-[10px_10px_0px_#be123c] md:shadow-[20px_20px_0px_#be123c] relative animate-in zoom-in duration-300 my-auto">
        <button onClick={onClose} className="fixed sm:absolute top-2 right-2 sm:-top-6 sm:-right-6 bg-black text-white w-10 h-10 sm:w-14 sm:h-14 border-2 sm:border-4 border-white rounded-full comic-font text-xl sm:text-3xl flex items-center justify-center">X</button>
        
        <div className="text-center space-y-2 mb-6 md:mb-10">
          <h2 className="comic-font text-4xl sm:text-6xl text-black uppercase italic leading-none">SUBMIT INTEL</h2>
          <p className="text-zinc-500 font-black uppercase text-[10px] sm:text-xs tracking-widest">HELP US IMPROVE THE PROTOCOL</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          <textarea 
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 sm:h-48 bg-zinc-100 border-2 md:border-4 border-black p-4 sm:p-6 rounded-[1.2rem] md:rounded-[2rem] text-black font-black text-base sm:text-xl outline-none focus:border-amber-400 transition-colors placeholder:text-zinc-400 uppercase"
            placeholder="NARRATIVE AND ART QUALITY FEEDBACK"
          />
          
          <button 
            disabled={!text.trim()}
            onClick={() => onSubmit(text)}
            className="w-full bg-amber-400 text-black p-4 sm:p-8 comic-font text-2xl sm:text-4xl border-2 md:border-4 border-black shadow-[5px_5px_0px_#000] active:translate-y-1 transition-all disabled:opacity-50 uppercase italic"
          >
            SEND INTEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
