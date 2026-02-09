
import React from 'react';
import { ComicPanelData } from '../types';

interface ComicPanelProps {
  panel: ComicPanelData;
}

const ComicPanel: React.FC<ComicPanelProps> = ({ panel }) => {
  return (
    <div className={`relative w-full h-full bg-zinc-900 border-4 md:border-[16px] border-black overflow-hidden group rounded-[1rem] md:rounded-[4rem] shadow-[5px_5px_0px_#000] md:shadow-[12px_12px_0px_#000] ${panel.isCover ? 'ring-4 md:ring-8 ring-amber-400' : ''}`}>
      {panel.imageUrl ? (
        <img 
          src={panel.imageUrl} 
          alt={panel.description} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 text-center bg-zinc-950">
          <div className="w-10 h-10 md:w-20 md:h-20 border-[6px] md:border-[12px] border-rose-700 border-t-amber-400 rounded-full animate-spin mb-4 md:mb-8"></div>
          <p className="comic-font text-base md:text-2xl text-zinc-700 uppercase italic">INKING FRAME...</p>
        </div>
      )}

      {/* Refined Publisher Badge Watermark */}
      <div className="absolute top-0 right-0 z-50 pointer-events-none select-none">
        <div className="relative transform rotate-12 translate-x-2 -translate-y-1 md:translate-x-5 md:-translate-y-3">
          <div className="bg-amber-400 border-2 md:border-4 border-black px-2 md:px-4 py-0.5 md:py-1.5 shadow-lg">
            <div className="flex flex-col items-center">
              <span className="comic-font text-[8px] md:text-2xl text-black leading-none uppercase italic">CINE</span>
              <span className="comic-font text-[8px] md:text-2xl text-rose-700 leading-none uppercase italic -mt-0.5">COMIC</span>
              <div className="w-full h-px md:h-0.5 bg-black my-0.5"></div>
              <span className="font-black text-[4px] md:text-[8px] text-black tracking-widest uppercase">AI ARCHITECT</span>
            </div>
          </div>
        </div>
      </div>

      {panel.imageUrl && (
        <>
          {panel.isCover && (
            <div className="absolute top-4 md:top-8 inset-x-0 text-center z-20 pointer-events-none px-4">
               <h2 className="comic-font text-2xl sm:text-4xl md:text-6xl lg:text-7xl text-white leading-none drop-shadow-[3px_3px_0px_#be123c] md:drop-shadow-[8px_8px_0px_#be123c] uppercase italic">CINE<br/>COMIC</h2>
               <p className="bg-amber-400 text-black px-3 md:px-6 py-0.5 md:py-1 border-2 md:border-4 border-black comic-font text-[10px] md:text-2xl inline-block mt-1 md:mt-2 shadow-lg rotate-1 uppercase">ISSUE #1</p>
            </div>
          )}

          {panel.dialogue && !panel.isCover && (
            <div className="absolute top-3 left-3 md:top-6 md:left-6 max-w-[85%] md:max-w-[80%] z-10 pointer-events-none transform -rotate-1">
              <div className="comic-bubble shadow-lg md:shadow-xl border-2 md:border-4 overflow-hidden">
                <p className="text-[9px] sm:text-xs md:text-xl lg:text-2xl font-black uppercase text-black leading-tight tracking-tight break-words">
                  {panel.dialogue}
                </p>
              </div>
            </div>
          )}

          {panel.onomatopoeia && (
            <div className={`absolute ${panel.isCover ? 'bottom-12 left-4' : 'bottom-12 right-4'} md:${panel.isCover ? 'bottom-20 left-8' : 'bottom-20 right-8'} z-10 transform ${panel.isCover ? 'rotate-[-5deg]' : 'rotate-[-10deg]'} pointer-events-none`}>
              <span className={`comic-font ${panel.isCover ? 'text-3xl md:text-7xl lg:text-8xl' : 'text-2xl md:text-6xl lg:text-7xl'} text-amber-400 drop-shadow-[2px_2px_0px_#000] md:drop-shadow-[6px_6px_0px_#000] uppercase italic leading-none`}>
                {panel.onomatopoeia}
              </span>
            </div>
          )}
          
          {/* Enhanced Text Box */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 md:p-8 flex items-end min-h-[80px] md:min-h-[180px]">
            <div className="p-2 md:p-4 bg-black/40 backdrop-blur-md border-l-4 md:border-l-[12px] border-rose-700 rounded-r-[0.8rem] md:rounded-r-[1.5rem]">
              <p className="text-[8px] sm:text-[10px] md:text-lg lg:text-xl text-white font-black italic uppercase leading-tight tracking-tight line-clamp-3 md:line-clamp-none">
                {panel.description}
              </p>
            </div>
          </div>
        </>
      )}
      
      <div className="absolute inset-0 pointer-events-none halftone opacity-10"></div>
    </div>
  );
};

export default ComicPanel;
