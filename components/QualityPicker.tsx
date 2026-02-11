
import React from 'react';
import { QualityMode } from '../types';

interface QualityPickerProps {
  selected: QualityMode;
  onSelect: (mode: QualityMode) => void;
  disabled: boolean;
}

const QualityPicker: React.FC<QualityPickerProps> = ({ selected, onSelect, disabled }) => {
  const options = [
    { 
      mode: QualityMode.FAST, 
      label: "FAST", 
      desc: "Rapid extraction. Basic line-work.", 
      power: 30, 
      color: "bg-zinc-500",
      multiplier: "1X"
    },
    { 
      mode: QualityMode.STUDIO, 
      label: "STUDIO", 
      desc: "Enhanced shading. Narrative depth.", 
      power: 70, 
      color: "bg-amber-400",
      multiplier: "2X",
      featured: true
    },
    { 
      mode: QualityMode.ULTRA, 
      label: "ULTRA", 
      desc: "Maximum fidelity. Neural mastery.", 
      power: 100, 
      color: "bg-rose-700",
      multiplier: "5X"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto px-4">
      {options.map((opt) => (
        <button
          key={opt.mode}
          onClick={() => onSelect(opt.mode)}
          disabled={disabled}
          className={`relative p-8 md:p-12 border-4 rounded-[2.5rem] transition-all group overflow-hidden text-left
            ${selected === opt.mode 
              ? 'bg-zinc-900 border-amber-400 shadow-[10px_10px_0px_#000] translate-y-[-4px]' 
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-500 shadow-none'}
            ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'active:translate-y-0 active:shadow-none'}
          `}
        >
          {opt.featured && (
            <div className="absolute top-4 right-4 bg-amber-400 text-black px-3 py-0.5 font-black text-[10px] uppercase border-2 border-black rotate-12">
              RECOMMENDED
            </div>
          )}
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-end">
              <h3 className={`comic-font text-4xl md:text-6xl italic leading-none ${selected === opt.mode ? 'text-white' : 'text-zinc-600'}`}>
                {opt.label}
              </h3>
              <span className={`font-black text-xl md:text-3xl ${selected === opt.mode ? 'text-amber-400' : 'text-zinc-800'}`}>
                {opt.multiplier}
              </span>
            </div>

            <p className={`text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed ${selected === opt.mode ? 'text-zinc-400' : 'text-zinc-700'}`}>
              {opt.desc}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                <span>Power Output</span>
                <span>{opt.power}%</span>
              </div>
              <div className="h-3 w-full bg-black rounded-full overflow-hidden border-2 border-zinc-800">
                <div 
                  className={`h-full transition-all duration-700 ${opt.color}`} 
                  style={{ width: selected === opt.mode ? `${opt.power}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 halftone opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"></div>
        </button>
      ))}
    </div>
  );
};

export default QualityPicker;
