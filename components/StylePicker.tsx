
import React from 'react';
import { ComicStyle } from '../types';

interface StylePickerProps {
  selected: ComicStyle;
  onSelect: (style: ComicStyle) => void;
  disabled: boolean;
}

const StylePicker: React.FC<StylePickerProps> = ({ selected, onSelect, disabled }) => {
  const styles = Object.values(ComicStyle);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 w-full px-2 sm:px-0 max-w-5xl mx-auto">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onSelect(style)}
          disabled={disabled}
          className={`px-4 py-6 md:py-12 rounded-[1rem] md:rounded-[2rem] border-2 md:border-4 text-xl sm:text-2xl md:text-3xl comic-font uppercase italic transition-all relative overflow-hidden group
            ${selected === style 
              ? 'bg-rose-700 border-black text-white shadow-none translate-y-1' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-amber-400 hover:text-white shadow-[4px_4px_0px_#000]'}
            ${disabled ? 'opacity-40 grayscale' : 'active:translate-y-1 active:shadow-none'}
          `}
        >
          {selected === style && (
             <div className="absolute top-0 right-0 p-1 md:p-2 text-[6px] md:text-[8px] bg-amber-400 text-black border-b border-l md:border-b-2 md:border-l-2 border-black rotate-12 translate-x-1 -translate-y-1 font-black z-10 tracking-widest">
               SELECTED
             </div>
          )}
          <span className="relative z-10 block leading-tight">{style.split(' (')[0]}</span>
          <div className="absolute inset-0 halftone opacity-5 group-hover:opacity-15 pointer-events-none transition-opacity duration-700"></div>
        </button>
      ))}
    </div>
  );
};

export default StylePicker;
