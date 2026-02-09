
import React, { useRef, useState, useEffect } from 'react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  onUrlSelect: (url: string) => void;
  onDurationCapture: (duration: number) => void;
  previewUrl: string | null;
  youtubeUrl: string | null;
  disabled: boolean;
}

interface MetaData {
  title: string;
  duration: number;
  thumb?: string;
  size?: string;
  id?: string;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onFileSelect, onUrlSelect, onDurationCapture, previewUrl, youtubeUrl, disabled 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'file' | 'youtube'>('file');
  const [tempUrl, setTempUrl] = useState('');
  const [meta, setMeta] = useState<MetaData | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMeta({ 
        title: file.name, 
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        duration: 0 
      });
      onFileSelect(file);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    if (d && !isNaN(d)) {
      setMeta(prev => prev ? { ...prev, duration: d } : null);
      onDurationCapture(d);
    }
  };

  // Immediate detection and sync of YouTube links
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setTempUrl(url);
    
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (match && match[2].length === 11) {
      onUrlSelect(url.trim());
    } else if (url.trim() === '') {
      onUrlSelect('');
      setMeta(null);
    }
  };

  useEffect(() => {
    if (youtubeUrl) {
      const match = youtubeUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
      if (match && match[2].length === 11) {
        const id = match[2];
        setMeta({ 
          id,
          title: `REMOTE_TARGET_${id.toUpperCase().substring(0, 6)}`,
          thumb: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, 
          duration: 120.0 
        });
        onDurationCapture(120.0); 
      }
    } else if (previewUrl) {
        // Mode remains in 'file' if previewUrl exists
    } else {
      setMeta(null);
    }
  }, [youtubeUrl, previewUrl, onDurationCapture]);

  const reset = () => {
    setMeta(null);
    setTempUrl('');
    onUrlSelect('');
    onFileSelect(null as any);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-2">
      <div className="flex gap-4 justify-center">
        <button 
          onClick={() => { reset(); setMode('file'); }} 
          className={`flex-1 sm:flex-none px-6 sm:px-12 py-3 sm:py-4 comic-font text-xl sm:text-3xl border-4 border-black rounded-2xl transition-all ${mode === 'file' ? 'bg-rose-700 text-white shadow-[4px_4px_0px_#000]' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
        >
          UPLOAD FILE
        </button>
        <button 
          onClick={() => { reset(); setMode('youtube'); }} 
          className={`flex-1 sm:flex-none px-6 sm:px-12 py-3 sm:py-4 comic-font text-xl sm:text-3xl border-4 border-black rounded-2xl transition-all ${mode === 'youtube' ? 'bg-rose-700 text-white shadow-[4px_4px_0px_#000]' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
        >
          PASTE LINK
        </button>
      </div>

      {(previewUrl || youtubeUrl) && meta ? (
        <div className="bg-zinc-900 border-4 md:border-8 border-black p-4 md:p-10 rounded-[2rem] md:rounded-[4rem] shadow-[10px_10px_0px_#be123c] animate-in zoom-in duration-500 relative overflow-hidden group">
          <div className="absolute inset-0 halftone opacity-10 pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row gap-6 md:gap-12 items-center relative z-10">
            {/* Visual Frame */}
            <div className="w-full lg:w-[450px] aspect-video bg-black rounded-2xl overflow-hidden border-4 md:border-8 border-black shadow-2xl relative shrink-0 group-hover:scale-[1.01] transition-transform duration-500">
              {mode === 'file' && previewUrl ? (
                <video src={previewUrl} onLoadedMetadata={handleLoadedMetadata} className="w-full h-full object-cover" controls muted />
              ) : (
                <div className="w-full h-full relative">
                   <img src={meta.thumb} className="w-full h-full object-cover opacity-80" alt="Video Preview" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-700 rounded-full flex items-center justify-center border-4 border-black shadow-2xl group-hover:scale-110 transition-transform">
                         <i className="fas fa-play text-white text-2xl md:text-4xl ml-1"></i>
                      </div>
                   </div>
                   <div className="absolute top-4 left-4 bg-amber-400 text-black px-4 py-1 comic-font text-lg md:text-xl border-2 border-black -rotate-2">REMOTE FEED</div>
                </div>
              )}
              <div className="absolute inset-0 halftone opacity-10 pointer-events-none"></div>
            </div>
            
            {/* Metadata Text */}
            <div className="flex-1 space-y-4 md:space-y-6 w-full text-center lg:text-left">
              <div className="space-y-1 md:space-y-2">
                <span className="bg-rose-700 text-white px-3 py-1 font-black text-[10px] uppercase border-2 border-black inline-block tracking-widest italic -rotate-1">SOURCE DETECTED</span>
                <h3 className="comic-font text-2xl md:text-5xl text-white uppercase italic leading-tight break-all">
                  {meta.title}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-black/60 p-3 md:p-4 border-2 border-zinc-800 rounded-2xl">
                  <p className="text-zinc-500 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">LENGTH</p>
                  <p className="text-white font-black text-sm md:text-2xl">{meta.duration.toFixed(1)}s</p>
                </div>
                <div className="bg-black/60 p-3 md:p-4 border-2 border-zinc-800 rounded-2xl">
                  <p className="text-zinc-500 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">{mode === 'file' ? 'SIZE' : 'STREAM_ID'}</p>
                  <p className="text-amber-400 font-black text-sm md:text-2xl truncate">{meta.size || meta.id || 'N/A'}</p>
                </div>
              </div>
              
              <button onClick={reset} className="w-full lg:w-auto bg-zinc-800 text-rose-500 font-black uppercase text-[10px] px-8 py-3 border-2 border-black rounded-xl hover:bg-rose-700 hover:text-white transition-all shadow-lg active:translate-y-1">
                <i className="fas fa-trash-alt mr-2"></i>DE-SYNC SOURCE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="border-6 md:border-8 border-dashed border-zinc-800 bg-zinc-900/30 p-12 md:p-32 rounded-[2.5rem] md:rounded-[6rem] text-center hover:border-rose-700 transition-all cursor-pointer group relative overflow-hidden"
          onClick={() => mode === 'file' && !disabled && inputRef.current?.click()}
        >
          <div className="absolute inset-0 halftone opacity-5 pointer-events-none"></div>
          
          {mode === 'file' ? (
            <div className="space-y-6 relative z-10">
              <input type="file" ref={inputRef} onChange={handleFile} accept="video/*" className="hidden" />
              <div className="w-20 h-20 md:w-32 md:h-32 bg-rose-700 rounded-3xl mx-auto flex items-center justify-center border-6 border-black shadow-[10px_10px_0px_#000] group-hover:scale-110 group-hover:rotate-6 transition-all">
                <i className="fas fa-film text-3xl md:text-5xl text-white"></i>
              </div>
              <h3 className="comic-font text-4xl md:text-7xl text-white uppercase italic drop-shadow-[4px_4px_0px_#000]">DROP ASSET</h3>
              <p className="text-zinc-500 font-black uppercase text-xs md:text-lg tracking-[0.4em] italic">CLICK TO BROWSE LOCAL INTEL</p>
            </div>
          ) : (
            <div className="space-y-8 max-w-2xl mx-auto w-full relative z-10" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 md:w-32 md:h-32 bg-amber-400 rounded-3xl mx-auto flex items-center justify-center border-6 border-black shadow-[10px_10px_0px_#000] group-hover:scale-110 group-hover:-rotate-6 transition-all">
                <i className="fab fa-youtube text-3xl md:text-5xl text-black"></i>
              </div>
              <h3 className="comic-font text-4xl md:text-7xl text-white uppercase italic drop-shadow-[4px_4px_0px_#000]">LINK SYNC</h3>
              <div className="relative group">
                 <input 
                  type="text" 
                  value={tempUrl} 
                  onChange={handleUrlChange} 
                  autoFocus
                  className="w-full bg-black border-4 border-black p-5 sm:p-7 rounded-2xl text-white font-black text-lg sm:text-2xl outline-none focus:border-amber-400 transition-all uppercase placeholder:text-zinc-800 text-center" 
                  placeholder="PASTE YOUTUBE URL HERE" 
                 />
                 <div className="absolute inset-0 pointer-events-none border-2 border-white/5 rounded-2xl scale-[1.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <p className="text-zinc-600 font-black uppercase text-[8px] sm:text-[10px] tracking-[0.6em] italic animate-pulse">AUTO-DETECTION ENGAGED...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
