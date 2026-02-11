
import React from 'react';
import { ComicPanelData } from '../types';

interface ComicPanelProps {
  panel: ComicPanelData;
  title?: string;
}

const ComicPanel: React.FC<ComicPanelProps> = ({ panel, title = "ACTION STORY" }) => {
  return (
    <div className={`relative w-full aspect-[1/1] bg-zinc-900 border-4 md:border-[16px] border-black overflow-hidden group rounded-[1rem] md:rounded-[3rem] shadow-[5px_5px_0px_#000] md:shadow-[12px_12px_0px_#000] ${panel.isCover ? 'ring-2 md:ring-4 ring-rose-700' : ''}`}>
      {panel.imageUrl ? (
        <img 
          src={panel.imageUrl} 
          alt={panel.description} 
          className="w-full h-full object-cover animate-in fade-in zoom-in duration-700"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 text-center bg-zinc-950">
          <div className="w-10 h-10 md:w-20 md:h-20 border-[6px] md:border-[12px] border-rose-700 border-t-amber-400 rounded-full animate-spin mb-4 md:mb-8"></div>
          <p className="comic-font text-base md:text-2xl text-zinc-700 uppercase italic">INKING FRAME...</p>
        </div>
      )}

      {panel.imageUrl && (
        <>
          {/* Dialogue Bubble - Positioned to look like professional comic lettering */}
          {panel.dialogue && panel.dialogue.length > 1 && (
            <div className="absolute top-4 left-4 max-w-[85%] z-10 pointer-events-none transform -rotate-1">
              <div className="comic-bubble shadow-xl border-2 md:border-4">
                <p className="text-[10px] sm:text-xs md:text-xl font-black uppercase text-black leading-tight tracking-tight break-words">
                  {panel.dialogue}
                </p>
              </div>
            </div>
          )}

          {/* Onomatopoeia - Only displayed if significant, stylized to the genre */}
          {panel.onomatopoeia && panel.onomatopoeia.length > 2 && (
            <div className={`absolute bottom-6 right-6 z-10 transform rotate-[-8deg] pointer-events-none`}>
              <span className={`comic-font text-3xl md:text-7xl text-amber-400 drop-shadow-[2px_2px_0px_#000] md:drop-shadow-[6px_6px_0px_#000] uppercase italic leading-none`}>
                {panel.onomatopoeia}
              </span>
            </div>
          )}
        </>
      )}
      
      {/* Subtle Halftone Overlay for consistent texture */}
      <div className="absolute inset-0 pointer-events-none halftone opacity-[0.08]"></div>
    </div>
  );
};

export default ComicPanel;
