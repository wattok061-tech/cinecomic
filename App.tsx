
import React, { useState, useEffect, useTransition } from 'react';
import VideoUploader from './components/VideoUploader';
import StylePicker from './components/StylePicker';
import QualityPicker from './components/QualityPicker';
import ComicPanel from './components/ComicPanel';
import PricingModal from './components/PricingModal';
import FeedbackModal from './components/FeedbackModal';
import LegalModal from './components/LegalModal';
import { ComicState, ComicStyle, AppView, User, QualityMode, DashboardStep, ComicPanelData } from './types';
import { analyzeVideoToPanels, generatePanelImage } from './services/geminiService';
import { soundManager, SFX } from './services/soundService';

const CURATED_PERSONAS = [
  { id: 'vigilante', name: 'The Vigilante', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow&backgroundColor=1a1a1a' },
  { id: 'tech-mage', name: 'Tech Mage', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=312e81' },
  { id: 'brute', name: 'The Brute', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scooter&backgroundColor=166534' },
  { id: 'ghost', name: 'The Ghost', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight&backgroundColor=4b5563' },
];

const App: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ComicState & { hasClaimedWelcome: boolean, dashboardStep: DashboardStep, storySummary?: string }>({
    view: 'landing',
    user: null,
    videoFile: null,
    videoPreviewUrl: null,
    youtubeUrl: null,
    youtubeThumb: null,
    videoDuration: 0,
    quality: QualityMode.STUDIO,
    style: ComicStyle.MODERN_DC,
    panels: [],
    status: 'idle',
    error: null,
    hasClaimedWelcome: false,
    dashboardStep: 'source',
    comicTitle: "UNNAMED MISSION",
    characterDescription: "",
    storySummary: ""
  });

  const [showBilling, setShowBilling] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [displayedCredits, setDisplayedCredits] = useState(0);

  useEffect(() => {
    if (state.user) {
      const target = state.user.credits;
      if (displayedCredits !== target) {
        const timeout = setTimeout(() => {
          const diff = target - displayedCredits;
          const step = diff > 0 ? Math.ceil(diff / 5) : Math.floor(diff / 5);
          const nextValue = diff !== 0 ? displayedCredits + step : target;
          setDisplayedCredits(nextValue);
        }, 30);
        return () => clearTimeout(timeout);
      }
    }
  }, [state.user?.credits, displayedCredits]);

  const triggerWipe = (callback: () => void) => {
    const wipe = document.getElementById('wipe');
    if (wipe) {
      requestAnimationFrame(() => {
        wipe.classList.remove('wipe-active');
        void wipe.offsetWidth; 
        wipe.classList.add('wipe-active');
        setTimeout(() => {
          startTransition(() => { callback(); });
        }, 400);
      });
    } else {
      startTransition(() => { callback(); });
    }
  };

  const handleLogoClick = () => {
    if (state.user) {
      triggerWipe(() => {
        setState(s => ({ ...s, view: 'dashboard', dashboardStep: 'source', panels: [], status: 'idle', error: null }));
      });
    } else {
      triggerWipe(() => setState(s => ({ ...s, view: 'landing' })));
    }
  };

  const handleLogout = () => {
    triggerWipe(() => {
      setState(prev => ({
        ...prev,
        view: 'landing',
        user: null,
        panels: [],
        dashboardStep: 'source',
        status: 'idle',
        videoFile: null,
        videoPreviewUrl: null,
        youtubeUrl: null,
        hasClaimedWelcome: false
      }));
    });
  };

  const checkAndOpenKey = async (targetView: AppView) => {
    if (typeof (window as any).aistudio !== 'undefined') {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
      } catch (err) {
        console.warn("API Key selection prompt failed", err);
      }
    }
    triggerWipe(() => setState(s => ({ ...s, view: targetView })));
  };

  const calculateRequiredCredits = () => {
    const base = Math.ceil(state.videoDuration / 10) || 1; 
    const multipliers = { [QualityMode.FAST]: 1, [QualityMode.STUDIO]: 2, [QualityMode.ULTRA]: 5 };
    return base * (multipliers[state.quality] || 1);
  };

  const handleGoogleSignIn = () => {
    soundManager.play(SFX.HEROIC);
    const user: User = { 
      name: 'Hero ' + Math.floor(Math.random() * 900 + 100), 
      email: 'hero@cinecomic.ai', 
      avatarUrl: CURATED_PERSONAS[Math.floor(Math.random() * CURATED_PERSONAS.length)].url, 
      credits: 0, 
      subscription: 'Free' 
    };
    triggerWipe(() => setState(prev => ({ ...prev, user, view: 'onboarding', hasClaimedWelcome: false })));
  };

  const claimBonus = () => {
    soundManager.play(SFX.ENERGY);
    setState(prev => ({
      ...prev,
      hasClaimedWelcome: true,
      user: prev.user ? { ...prev.user, credits: 30 } : null
    }));
  };

  const startGeneration = async () => {
    const cost = calculateRequiredCredits();
    if (!state.user || state.user.credits < cost) {
      setShowBilling(true);
      return;
    }
    
    setState(prev => ({ ...prev, dashboardStep: 'loading', status: 'analyzing', error: null }));
    
    try {
      let inputData = "";
      if (state.videoFile) {
        inputData = await new Promise((res) => {
          const reader = new FileReader();
          reader.readAsDataURL(state.videoFile!);
          reader.onload = () => res((reader.result as string).split(',')[1]);
        });
      } else { inputData = state.youtubeUrl || ""; }

      const { panels, title, charDesc, storySummary } = await analyzeVideoToPanels(inputData, state.videoFile?.type || 'text/plain', state.style!, state.videoDuration, !!state.youtubeUrl);
      
      const allPanels = panels.map(p => ({ ...p, generating: true }));

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, credits: prev.user.credits - cost } : null,
        panels: allPanels,
        dashboardStep: 'result',
        status: 'generating_panels',
        comicTitle: title,
        storySummary,
        characterDescription: charDesc
      }));

      for (const panel of allPanels) {
        const imageUrl = await generatePanelImage(panel, state.style!, charDesc);
        setState(prev => ({
          ...prev,
          panels: prev.panels.map(p => p.id === panel.id ? { ...p, imageUrl, generating: false } : p)
        }));
      }
      setState(prev => ({ ...prev, status: 'completed' }));
    } catch (err: any) {
      setState(prev => ({ ...prev, status: 'error', error: err.message, dashboardStep: 'source' }));
    }
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 halftone opacity-10 pointer-events-none"></div>
      
      <div className="max-w-6xl w-full text-center space-y-12 relative z-10 py-20">
        <header className="space-y-6">
          <div className="flex justify-center">
            <span className="bg-rose-700 text-white px-8 py-3 comic-font text-xl md:text-3xl uppercase italic border-4 border-black inline-block tracking-widest -rotate-2 shadow-xl animate-bounce">
              NEURAL INKING ACTIVE
            </span>
          </div>
          <h1 className="text-[14vw] md:text-[9vw] comic-font text-white uppercase italic drop-shadow-[20px_20px_0px_#be123c] leading-none tracking-tighter">
            ACTION<br/><span className="text-amber-400">TO</span> INK
          </h1>
          <p className="text-zinc-500 font-black uppercase text-sm md:text-2xl tracking-[0.2em] max-w-3xl mx-auto leading-relaxed italic">
            YOUR FOOTAGE IS THE SCRIPT. OUR AI IS THE ARTIST. <br className="hidden md:block"/>
            GENERATE ELITE GRAPHIC NOVELS IN SECONDS.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-10 justify-center items-center pt-8">
          <button 
            onClick={() => checkAndOpenKey('auth')} 
            className="group relative bg-amber-400 px-12 md:px-24 py-8 md:py-12 comic-font text-5xl md:text-8xl text-black border-8 border-black shadow-[20px_20px_0px_#000] hover:scale-105 transition-all italic uppercase overflow-hidden active:translate-y-2 active:shadow-none"
          >
            <div className="absolute inset-0 halftone opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity"></div>
            ENROLL NOW
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left">
           {[
             { title: "NEURAL INKING", icon: "fa-brain", desc: "Proprietary generative engine trained on elite comic artistry." },
             { title: "NARRATIVE SYNC", icon: "fa-project-diagram", desc: "Gemini analyzes frames to distill the perfect 6-panel arc." },
             { title: "HIGH-RES EXPORT", icon: "fa-file-download", desc: "Studio-quality rendering optimized for print and web." }
           ].map((feat, i) => (
             <div key={i} className="bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_#be123c] transform hover:-translate-y-2 transition-transform">
                <i className={`fas ${feat.icon} text-amber-400 text-4xl mb-4`}></i>
                <h3 className="comic-font text-3xl text-white mb-2 italic">{feat.title}</h3>
                <p className="text-zinc-500 font-black text-xs uppercase tracking-wider">{feat.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-zinc-950 pb-0 view-fade-in relative selection:bg-rose-700 selection:text-white flex flex-col">
      <header className="py-4 px-4 md:px-12 border-b-4 border-black bg-zinc-900 flex justify-between items-center sticky top-0 z-[60] w-full">
        <div className="flex items-center gap-6">
          <h1 onClick={handleLogoClick} className="comic-font text-xl md:text-4xl text-white italic cursor-pointer tracking-tighter hover:text-amber-400 transition-colors">
            CINE<span className="text-amber-400">COMIC</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="text-right hidden sm:block cursor-pointer group" onClick={() => setShowBilling(true)}>
            <p className="text-amber-400 font-black italic text-lg md:text-2xl tracking-tighter leading-none group-hover:underline">{state.user?.name}</p>
            <p className="text-[9px] md:text-[11px] font-black uppercase text-white/50 tracking-[0.2em] mt-1.5">{displayedCredits} ENERGY CORES</p>
          </div>
          <div className="relative group flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="bg-zinc-800 border-2 border-black p-2 md:p-3 rounded-xl text-rose-500 hover:bg-rose-700 hover:text-white transition-all shadow-lg text-xs md:text-base flex items-center gap-2"
              title="DISCONNECT"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden lg:inline font-black uppercase tracking-widest text-[10px]">Logout</span>
            </button>
            <img src={state.user?.avatarUrl} className="w-10 h-10 md:w-16 md:h-16 border-2 md:border-4 border-rose-700 rounded-xl bg-white shadow-2xl" alt="Avatar" />
          </div>
        </div>
      </header>

      {/* CLAIM BONUS OVERLAY - For every new user */}
      {!state.hasClaimedWelcome && state.user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-white border-[12px] border-black p-10 md:p-16 max-w-2xl w-full rounded-[4rem] text-center shadow-[30px_30px_0px_#be123c] animate-in zoom-in duration-500 relative">
              <div className="absolute -top-12 -right-8 bg-amber-400 text-black px-10 py-3 comic-font text-4xl border-4 border-black rotate-12 shadow-2xl uppercase italic">
                 FREE GIFT!
              </div>
              <h2 className="comic-font text-6xl md:text-[8rem] text-black mb-8 leading-none uppercase italic drop-shadow-[4px_4px_0px_#fbbf24]">WELCOME RECRUIT</h2>
              <p className="text-zinc-600 font-black uppercase text-xl md:text-3xl mb-12 italic leading-tight">
                 YOU NEED FUEL TO DRAW. <br/> WE'RE GIVING YOU <span className="text-rose-700">30 ENERGY CORES</span> TO START.
              </p>
              <button 
                 onClick={claimBonus}
                 className="group w-full bg-black text-white py-8 comic-font text-5xl md:text-7xl border-8 border-black shadow-[15px_15px_0px_#be123c] hover:scale-105 hover:bg-rose-700 transition-all uppercase italic active:translate-y-2 active:shadow-none"
              >
                 CLAIM CORES!
              </button>
           </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-12 flex-grow w-full">
        {state.dashboardStep === 'source' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10">
            <div className="text-center space-y-4">
              <h2 className="comic-font text-4xl md:text-8xl text-white uppercase italic drop-shadow-[4px_4px_0px_#be123c]">SELECT SOURCE</h2>
              <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs md:text-lg italic">LOCAL FILE OR REMOTE LINK ENCRYPTION</p>
            </div>
            <VideoUploader 
              onFileSelect={(f) => { setState(s => ({ ...s, videoFile: f, youtubeUrl: null, videoPreviewUrl: f ? URL.createObjectURL(f) : null })); }} 
              onUrlSelect={(u) => { setState(s => ({ ...s, youtubeUrl: u, videoFile: null, videoPreviewUrl: null })); }} 
              onDurationCapture={(d) => setState(s => ({ ...s, videoDuration: d }))} 
              previewUrl={state.videoPreviewUrl} 
              youtubeUrl={state.youtubeUrl} 
              disabled={false} 
            />
            {(state.videoFile || state.youtubeUrl) && (
              <div className="flex justify-center pt-6">
                <button 
                  onClick={() => { setState(s => ({ ...s, dashboardStep: 'style' })); }} 
                  className="bg-amber-400 px-16 py-6 comic-font text-3xl md:text-5xl border-4 border-black shadow-[10px_10px_0px_#000] hover:scale-105 transition-all uppercase italic"
                >
                  NEXT PROTOCOL
                </button>
              </div>
            )}
          </div>
        )}

        {state.dashboardStep === 'style' && (
          <div className="space-y-10">
            <div className="text-center space-y-4">
              <h2 className="comic-font text-4xl md:text-8xl text-white uppercase italic drop-shadow-[4px_4px_0px_#be123c]">ART PROTOCOL</h2>
              <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs md:text-lg italic">SELECT THE VISUAL FREQUENCY</p>
            </div>
            <StylePicker selected={state.style!} onSelect={(s) => { setState(prev => ({ ...prev, style: s })); }} disabled={false} />
            <div className="flex justify-center gap-6 pt-10">
              <button onClick={() => { setState(s => ({ ...s, dashboardStep: 'source' })); }} className="bg-zinc-800 text-white px-10 py-5 comic-font text-2xl border-4 border-black hover:bg-zinc-700 transition-all uppercase italic">BACK</button>
              <button onClick={() => { setState(s => ({ ...s, dashboardStep: 'quality' })); }} className="bg-amber-400 px-12 py-5 comic-font text-3xl border-4 border-black shadow-[8px_8px_0px_#000] hover:scale-105 transition-all uppercase italic">QUALITY</button>
            </div>
          </div>
        )}

        {state.dashboardStep === 'quality' && (
          <div className="space-y-10">
             <div className="text-center space-y-4">
              <h2 className="comic-font text-4xl md:text-8xl text-white uppercase italic drop-shadow-[4px_4px_0px_#be123c]">NEURAL QUALITY</h2>
              <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs md:text-lg italic">SELECT EXTRACTION FIDELITY</p>
            </div>
            <QualityPicker 
              selected={state.quality} 
              onSelect={(q) => setState(prev => ({ ...prev, quality: q }))} 
              disabled={false} 
            />
            <div className="flex justify-center gap-6 pt-10">
              <button onClick={() => { setState(s => ({ ...s, dashboardStep: 'style' })); }} className="bg-zinc-800 text-white px-10 py-5 comic-font text-2xl border-4 border-black hover:bg-zinc-700 transition-all uppercase italic">BACK</button>
              <button onClick={() => { setState(s => ({ ...s, dashboardStep: 'summary' })); }} className="bg-amber-400 px-12 py-5 comic-font text-3xl border-4 border-black shadow-[8px_8px_0px_#000] hover:scale-105 transition-all uppercase italic">DOSSIER</button>
            </div>
          </div>
        )}

        {state.dashboardStep === 'summary' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="text-center space-y-4">
              <h2 className="comic-font text-4xl md:text-8xl text-white uppercase italic drop-shadow-[4px_4px_0px_#be123c]">MISSION BRIEF</h2>
              <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs md:text-lg italic">FINAL PROTOCOL CONFIRMATION</p>
            </div>
            
            <div className="max-w-5xl mx-auto bg-zinc-900 border-8 border-black p-8 md:p-16 rounded-[4rem] shadow-[30px_30px_0px_#be123c] relative overflow-hidden">
              <div className="absolute top-10 right-10 rotate-12 opacity-10 pointer-events-none">
                 <i className="fas fa-stamp text-[10rem] text-rose-700"></i>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start mb-12 border-b-4 border-black pb-8 gap-6">
                 <div>
                    <h3 className="comic-font text-5xl md:text-7xl text-white italic leading-none">DOSSIER_{Math.floor(Math.random() * 9999)}</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <p className="text-zinc-500 font-black text-xs uppercase tracking-[0.5em]">CLASSIFIED INTEL</p>
                       <div className="bg-zinc-800 h-px w-20"></div>
                       <p className="text-rose-700 font-black text-xs uppercase tracking-widest italic">EYES ONLY</p>
                    </div>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <p className="text-amber-400 font-black text-[10px] uppercase tracking-[0.4em] mb-2">AUTH STATUS</p>
                    <div className="bg-rose-700 text-white px-6 py-2 comic-font text-2xl uppercase italic border-4 border-black -rotate-2 shadow-xl">
                      PENDING_INK
                    </div>
                 </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-16 relative z-10">
                 <div className="space-y-12">
                    <div className="space-y-4">
                       <p className="text-zinc-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                          <i className="fas fa-video text-rose-700"></i> ASSET ANALYSIS
                       </p>
                       <div className="bg-black/60 p-6 border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_#000]">
                          <p className="text-white font-black text-xl truncate uppercase leading-tight mb-4 tracking-tighter">
                            {state.videoFile?.name || "REMOTE_INTEL_STREAM"}
                          </p>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">DURATION</p>
                                <p className="text-amber-400 font-black text-xl">{state.videoDuration.toFixed(1)}S</p>
                             </div>
                             <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">EXTRACT</p>
                                <p className="text-amber-400 font-black text-xl">6 PANELS</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-zinc-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                          <i className="fas fa-palette text-rose-700"></i> ART PROTOCOLS
                       </p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-800 p-6 border-4 border-black rounded-[2rem] shadow-[6px_6px_0px_#000] flex flex-col justify-center">
                             <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">STYLE</p>
                             <p className="comic-font text-2xl text-amber-400 uppercase italic leading-none">{state.style?.split(' (')[0]}</p>
                          </div>
                          <div className="bg-zinc-800 p-6 border-4 border-black rounded-[2rem] shadow-[6px_6px_0px_#000] flex flex-col justify-center">
                             <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">QUALITY</p>
                             <p className="comic-font text-2xl text-rose-700 uppercase italic leading-none">{state.quality}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col justify-between bg-black/40 p-8 md:p-12 border-4 border-black rounded-[4rem] shadow-[15px_15px_0px_#000]">
                    <div className="space-y-6">
                       <div className="flex justify-between items-end border-b-2 border-zinc-800 pb-4">
                          <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">DEPLOYMENT COST</p>
                          <div className="text-right">
                             <p className="text-amber-400 font-black text-6xl uppercase tracking-tighter leading-none">{calculateRequiredCredits()}</p>
                             <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1">ENERGY CORES</p>
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-zinc-500">Vault Balance</span>
                             <span className={state.user?.credits! < calculateRequiredCredits() ? 'text-rose-500' : 'text-green-500'}>
                                {state.user?.credits} CORES
                             </span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-500 ${state.user?.credits! < calculateRequiredCredits() ? 'bg-rose-700' : 'bg-green-500'}`} 
                                style={{ width: `${Math.min(100, (state.user?.credits! / calculateRequiredCredits()) * 100)}%` }}
                             ></div>
                          </div>
                       </div>

                       <p className="text-zinc-600 text-[9px] font-black uppercase italic leading-relaxed text-center">
                          *ENGAGING THE NEURAL ENGINE WILL PERMANENTLY CONSUME ENERGY FROM YOUR VAULT RESERVES.
                       </p>
                    </div>

                    <div className="space-y-4 mt-8">
                       <button 
                         onClick={startGeneration} 
                         className="w-full bg-amber-400 text-black py-8 comic-font text-5xl md:text-7xl border-8 border-black shadow-[15px_15px_0px_#000] hover:scale-[1.05] hover:bg-rose-700 hover:text-white transition-all uppercase italic active:translate-y-2 active:shadow-none"
                       >
                         DEPLOY
                       </button>
                       <button 
                         onClick={() => setState(s => ({ ...s, dashboardStep: 'quality' }))}
                         className="w-full text-zinc-500 font-black uppercase text-[10px] hover:text-white transition-colors tracking-[0.5em]"
                       >
                         RE-INITIALIZE PROTOCOLS
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {state.dashboardStep === 'loading' && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-10 text-center px-4 animate-in zoom-in">
            <div className="relative w-48 h-48 md:w-96 md:h-96 border-[25px] border-black rounded-full flex items-center justify-center shadow-[30px_30px_0px_#be123c] animate-pulse bg-zinc-900">
               <div className="absolute inset-0 halftone opacity-20 pointer-events-none"></div>
              <span className="comic-font text-5xl md:text-9xl text-white italic">INK</span>
              <div className="absolute inset-[-25px] border-[25px] border-amber-400 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-4">
              <h3 className="comic-font text-4xl md:text-8xl text-white uppercase italic">NARRATIVE SYNC...</h3>
              <p className="text-zinc-500 font-black uppercase tracking-[0.6em] text-xs md:text-lg italic animate-pulse">DISTILLING FRAMES INTO LEGEND</p>
            </div>
          </div>
        )}

        {state.dashboardStep === 'result' && (
          <div className="flex flex-col items-center py-12 space-y-8 animate-in fade-in duration-700">
            <div className="text-center max-w-4xl px-4 space-y-6">
              <h2 className="comic-font text-4xl md:text-9xl text-white uppercase italic drop-shadow-[6px_6px_0px_#be123c] leading-none">{state.comicTitle}</h2>
              <div className="bg-rose-700/20 border-4 border-black p-6 rounded-[2rem] shadow-[8px_8px_0px_#000] relative">
                 <div className="absolute -top-3 left-6 bg-rose-700 text-white px-4 py-1 comic-font text-xl italic uppercase border-2 border-black -rotate-1">STORY_BEAT</div>
                 <p className="text-white font-bold text-base md:text-2xl italic leading-relaxed pt-2">"{state.storySummary}"</p>
              </div>
            </div>
            
            <div className="relative w-full max-w-5xl flex items-center justify-center">
              <button 
                onClick={() => { setCurrentPanelIndex(prev => Math.max(0, prev - 1)); }} 
                disabled={currentPanelIndex === 0} 
                className="absolute left-1 md:-left-24 z-50 bg-rose-700 text-white w-12 h-12 md:w-24 md:h-24 border-4 border-black rounded-full shadow-[6px_6px_0px_#000] disabled:opacity-20 hover:scale-110 active:translate-y-1 active:shadow-none transition-all"
              >
                <i className="fas fa-arrow-left text-xl md:text-5xl"></i>
              </button>
              
              <div className="w-full relative overflow-hidden px-4 md:px-0">
                <div className="flex transition-transform duration-700 cubic-bezier(0.7, 0, 0.3, 1)" style={{ transform: `translate3d(-${currentPanelIndex * 100}%, 0, 0)` }}>
                  {state.panels.map((p) => (
                    <div key={p.id} className="min-w-full flex justify-center py-12">
                       <div className="w-full max-w-3xl transform rotate-1 group">
                          <ComicPanel panel={p} title={state.comicTitle} />
                          <div className="mt-8 text-center opacity-80 group-hover:opacity-100 transition-opacity">
                             <p className="text-zinc-500 font-black uppercase text-xs md:text-sm tracking-[0.5em] mb-3">SEQUENCE_{state.panels.indexOf(p) + 1}</p>
                             <p className="text-white/70 font-bold text-xs md:text-lg uppercase tracking-wider max-w-xl mx-auto italic">{p.description.split('.')[0]}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => { setCurrentPanelIndex(prev => Math.min(state.panels.length - 1, prev + 1)); }} 
                disabled={currentPanelIndex === state.panels.length - 1} 
                className="absolute right-1 md:-right-24 z-50 bg-rose-700 text-white w-12 h-12 md:w-24 md:h-24 border-4 border-black rounded-full shadow-[6px_6px_0px_#000] disabled:opacity-20 hover:scale-110 active:translate-y-1 active:shadow-none transition-all"
              >
                <i className="fas fa-arrow-right text-xl md:text-5xl"></i>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 w-full max-w-4xl px-4 pt-16">
              <button 
                onClick={() => { triggerWipe(() => setState(s => ({ ...s, dashboardStep: 'source', panels: [], status: 'idle' }))); }} 
                className="flex-1 bg-zinc-900 text-white py-8 comic-font text-4xl border-8 border-black shadow-[12px_12px_0px_#000] hover:scale-[1.02] hover:bg-rose-700 transition-all uppercase italic active:translate-y-2 active:shadow-none"
              >
                NEW MISSION
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-16 px-6 border-t-8 border-black bg-zinc-900 mt-32">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 text-zinc-500 font-black uppercase text-xs tracking-[0.3em]">
          <div className="flex flex-col items-center md:items-start">
             <h4 className="comic-font text-2xl text-white italic mb-2 tracking-tighter">CINE<span className="text-amber-400">COMIC</span> AI</h4>
             <p>© 2024 PROTOCOL STATUS: NOMINAL.</p>
          </div>
          <div className="flex gap-12">
            <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors border-b border-transparent hover:border-white">Terms</button>
            <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors border-b border-transparent hover:border-white">Privacy</button>
          </div>
        </div>
      </footer>

      {showBilling && <PricingModal onClose={() => setShowBilling(false)} credits={state.user?.credits || 0} displayedCredits={displayedCredits} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col">
       {state.view === 'landing' ? renderLanding() : state.view === 'auth' ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
          <div className="bg-zinc-900 border-[10px] border-black p-12 md:p-20 max-w-xl w-full rounded-[4rem] text-center shadow-[25px_25px_0px_#be123c] animate-in zoom-in">
            <h2 className="comic-font text-7xl md:text-9xl text-white uppercase mb-12 italic">RECRUIT</h2>
            <div className="space-y-6">
               <button onClick={handleGoogleSignIn} className="w-full bg-white text-black py-6 md:py-8 comic-font text-3xl md:text-5xl border-8 border-black shadow-[10px_10px_0px_#be123c] hover:scale-[1.03] transition-all flex items-center justify-center gap-6 uppercase italic active:translate-y-2 active:shadow-none">
                  <i className="fab fa-google text-rose-700"></i> GOOGLE LINK
               </button>
               <p className="text-zinc-600 font-black text-xs uppercase tracking-widest pt-4">ENCRYPTION PROTOCOL: SECURE</p>
            </div>
          </div>
        </div>
      ) : state.view === 'onboarding' ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
          <div className="bg-zinc-900 border-[12px] border-black p-12 md:p-24 max-w-6xl w-full rounded-[5rem] text-center shadow-[40px_40px_0px_#be123c] animate-in zoom-in">
            <h2 className="comic-font text-7xl md:text-9xl text-white mb-16 uppercase italic leading-none">IDENT_LOG</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {CURATED_PERSONAS.map(p => (
                <button key={p.id} onClick={() => triggerWipe(() => setState(s => ({ ...s, view: 'dashboard', user: { ...s.user!, avatarUrl: p.url } })))} className="bg-zinc-800 border-4 border-black p-6 md:p-10 rounded-[3rem] hover:bg-amber-400 group transition-all hover:scale-110 active:translate-y-2">
                  <img src={p.url} className="w-full aspect-square bg-white border-4 border-black rounded-[2rem] mb-6" alt={p.name} />
                  <span className="comic-font text-2xl md:text-4xl text-white group-hover:text-black uppercase italic tracking-tighter leading-none">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : renderDashboard()}
    </div>
  );
};

export default App;
