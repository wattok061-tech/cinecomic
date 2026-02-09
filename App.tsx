
import React, { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import StylePicker from './components/StylePicker';
import ComicPanel from './components/ComicPanel';
import PricingModal from './components/PricingModal';
import FeedbackModal from './components/FeedbackModal';
import { ComicState, ComicStyle, AppView, User, QualityMode, DashboardStep, ComicPanelData } from './types';
import { analyzeVideoToPanels, generatePanelImage } from './services/geminiService';

const CURATED_PERSONAS = [
  { id: 'vigilante', name: 'The Vigilante', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow&backgroundColor=1a1a1a' },
  { id: 'tech-mage', name: 'Tech Mage', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=312e81' },
  { id: 'brute', name: 'The Brute', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scooter&backgroundColor=166534' },
  { id: 'ghost', name: 'The Ghost', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight&backgroundColor=4b5563' },
];

const STYLE_EXAMPLES = [
  { name: 'MODERN DC', img: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=600&auto=format&fit=crop', desc: 'Dramatic lighting and cinematic depth.' },
  { name: 'CLASSIC MANGA', img: 'https://images.unsplash.com/photo-1601850494422-3cf14624b0bb?q=80&w=600&auto=format&fit=crop', desc: 'Iconic B&W ink work and speed lines.' },
  { name: 'POP ART', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop', desc: 'Vintage Ben-Day dots and vibrant colors.' },
  { name: 'NOIR', img: 'https://images.unsplash.com/photo-1635350350717-380629c181dd?q=80&w=600&auto=format&fit=crop', desc: 'High contrast shadows and grit.' },
];

const App: React.FC = () => {
  const [state, setState] = useState<ComicState & { hasClaimedWelcome: boolean, dashboardStep: DashboardStep }>({
    view: 'landing',
    user: null,
    videoFile: null,
    videoPreviewUrl: null,
    youtubeUrl: null,
    youtubeThumb: null,
    videoDuration: 0,
    quality: QualityMode.ULTRA,
    style: ComicStyle.MODERN_DC,
    panels: [],
    status: 'idle',
    error: null,
    hasClaimedWelcome: false,
    dashboardStep: 'source'
  });

  const [showBilling, setShowBilling] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState(0);

  const checkAndOpenKey = async (targetView: AppView) => {
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    triggerWipe(() => setState(s => ({ ...s, view: targetView })));
  };

  const calculateRequiredCredits = () => {
    const base = Math.ceil(state.videoDuration / 10) || 1; 
    const multipliers = { [QualityMode.FAST]: 1, [QualityMode.STUDIO]: 2, [QualityMode.ULTRA]: 5 };
    return base * (multipliers[state.quality] || 1);
  };

  const triggerWipe = (callback: () => void) => {
    const wipe = document.getElementById('wipe');
    if (wipe) {
      wipe.classList.remove('wipe-active');
      void wipe.offsetWidth; 
      wipe.classList.add('wipe-active');
      setTimeout(callback, 500);
    } else { callback(); }
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const user: User = { 
      name: (formData.get('name') as string) || 'Hero', 
      email: (formData.get('email') as string) || '', 
      avatarUrl: CURATED_PERSONAS[0].url, 
      credits: 0, 
      subscription: 'Free' 
    };
    setState(prev => ({ ...prev, user }));
    triggerWipe(() => setState(s => ({ ...s, view: 'onboarding' })));
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
        youtubeUrl: null
      }));
    });
  };

  const handleClaimBonus = () => {
    if (state.hasClaimedWelcome || !state.user) return;
    setState(prev => ({
      ...prev,
      hasClaimedWelcome: true,
      user: { ...prev.user!, credits: prev.user!.credits + 30 }
    }));
  };

  const startGeneration = async () => {
    const cost = calculateRequiredCredits();
    if (!state.user || state.user.credits < cost) {
      setShowBilling(true);
      return;
    }
    
    setState(prev => ({ ...prev, dashboardStep: 'loading', status: 'analyzing' }));
    try {
      let inputData = "";
      const isYT = !!state.youtubeUrl;
      if (!isYT && state.videoFile) {
        inputData = await new Promise((res) => {
          const reader = new FileReader();
          reader.readAsDataURL(state.videoFile!);
          reader.onload = () => res((reader.result as string).split(',')[1]);
        });
      } else { inputData = state.youtubeUrl || ""; }

      const analyzedPanels = await analyzeVideoToPanels(
        inputData, 
        state.videoFile?.type || 'text/plain', 
        state.style!, 
        state.videoDuration,
        isYT
      );
      
      const coverPanel: ComicPanelData = {
        id: 'cover-' + Date.now(),
        description: `High-impact cinematic comic book cover art. Dramatic lighting, iconic hero pose.`,
        dialogue: `VOLUME 1: THE RECKONING`,
        characterExpression: "Determined and Powerful",
        onomatopoeia: "CINECOMIC",
        isCover: true,
        generating: true
      };

      const finalPanels = [coverPanel, ...analyzedPanels];
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, credits: prev.user.credits - cost } : null,
        panels: finalPanels,
        dashboardStep: 'result',
        status: 'generating_panels'
      }));

      for (const panel of finalPanels) {
        try {
          const imageUrl = await generatePanelImage(panel, state.style!);
          setState(prev => ({
            ...prev,
            panels: prev.panels.map(p => p.id === panel.id ? { ...p, imageUrl, generating: false } : p)
          }));
        } catch (err: any) {
          if (err.message?.includes("Requested entity was not found")) {
            await (window as any).aistudio?.openSelectKey();
          }
          console.error("Panel generation error", err);
        }
      }
      setState(prev => ({ ...prev, status: 'completed' }));
    } catch (err: any) {
      setState(prev => ({ ...prev, status: 'error', error: err.message, dashboardStep: 'summary' }));
    }
  };

  const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return (
      <div className="flex flex-col min-h-screen relative selection:bg-rose-700 selection:text-white">
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4 md:px-12 py-3 md:py-5 ${scrolled ? 'bg-zinc-950/95 backdrop-blur-xl border-b-2 border-rose-700 shadow-2xl' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="comic-font text-2xl md:text-3xl text-white italic tracking-tighter hover:rotate-2 transition-transform cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              CINE<span className="text-amber-400">COMIC</span>
            </h1>
            <div className="hidden lg:flex gap-10 items-center">
               <button onClick={() => scrollToSection('transformation')} className="text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Showcase</button>
               <button onClick={() => scrollToSection('how')} className="text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Process</button>
               <button onClick={() => scrollToSection('styles')} className="text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Protocols</button>
            </div>
            <button onClick={() => checkAndOpenKey('auth')} className="bg-rose-700 text-white px-6 md:px-8 py-2 md:py-3 comic-font text-lg md:text-2xl border-2 md:border-4 border-black shadow-[4px_4px_0px_#000] hover:scale-105 active:translate-y-1 transition-all uppercase italic">
              ENLIST
            </button>
          </div>
        </nav>

        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-32 md:pt-40 overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 speed-lines opacity-5 pointer-events-none"></div>
          <div className="absolute inset-0 halftone opacity-5 pointer-events-none"></div>
          
          <div className="absolute top-40 left-[8%] bg-amber-400 text-black px-4 py-1.5 md:px-8 md:py-4 comic-font text-lg md:text-5xl border-4 border-black -rotate-6 shadow-2xl animate-bounce hidden lg:block z-20">BOOM!</div>
          <div className="absolute bottom-40 right-[10%] bg-rose-700 text-white px-3 py-1.5 md:px-7 md:py-3.5 comic-font text-base md:text-4xl border-4 border-black rotate-12 shadow-2xl animate-pulse hidden lg:block z-20">ZAP!</div>

          <div className="relative z-10 space-y-6 md:space-y-12 max-w-6xl w-full px-4">
            <div className="inline-block bg-white text-black px-4 py-2 comic-font text-xs md:text-xl border-3 border-black -rotate-1 shadow-lg uppercase tracking-tight">THE FUTURE OF VISUAL NARRATIVE</div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] comic-font text-white leading-[0.9] drop-shadow-[5px_5px_0px_#be123c] md:drop-shadow-[15px_15px_0px_#be123c] uppercase italic tracking-tighter">
              ACTION<br/><span className="text-amber-400 drop-shadow-[3px_3px_0px_#000] md:drop-shadow-[10px_10px_0px_#000]">TO INK</span>
            </h1>
            
            <p className="text-lg sm:text-2xl md:text-4xl lg:text-5xl text-white font-black italic max-w-4xl mx-auto uppercase tracking-tighter leading-tight drop-shadow-lg">
              Redefine your footage. <br/>
              <span className="text-rose-600">The Preeminent AI Architect</span> transforms reality into a masterpiece graphic novel.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
              <button onClick={() => checkAndOpenKey('auth')} className="group bg-rose-700 px-10 md:px-20 py-5 md:py-10 comic-font text-3xl md:text-6xl text-white border-4 md:border-8 border-black shadow-[8px_8px_0px_#000] md:shadow-[15px_15px_0px_#000] hover:scale-105 active:scale-95 transition-all relative overflow-hidden italic uppercase">
                <span className="relative z-10">START MISSION</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          </div>
        </section>

        {/* Transformation Showcase Section */}
        <section id="transformation" className="bg-zinc-950 py-24 md:py-40 px-6 border-t-4 border-black relative overflow-hidden">
           <div className="absolute inset-0 halftone opacity-5 pointer-events-none"></div>
           <div className="max-w-7xl mx-auto space-y-16 md:space-y-32">
              <div className="text-center">
                <h2 className="comic-font text-5xl md:text-8xl text-white italic uppercase leading-none mb-4 drop-shadow-[4px_4px_0px_#be123c]">THE<br/><span className="text-rose-700">TRANSFORMATION</span></h2>
                <p className="text-zinc-500 font-black uppercase text-xs md:text-xl tracking-[0.3em] italic">REALITY MEETS THE PEN</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
                 <div className="relative group perspective-2000">
                    <div className="absolute -top-8 -left-8 bg-zinc-800 text-white px-6 py-3 comic-font text-2xl md:text-4xl border-4 border-black rotate-[-5deg] z-20 shadow-2xl">SOURCE VIDEO</div>
                    <div className="aspect-video bg-black border-4 md:border-[16px] border-black rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl transform group-hover:rotate-1 transition-all duration-700">
                       <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                          <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" type="video/mp4" />
                       </video>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    </div>
                 </div>

                 <div className="relative group perspective-2000">
                    <div className="absolute -top-8 -right-8 bg-amber-400 text-black px-6 py-3 comic-font text-2xl md:text-4xl border-4 border-black rotate-[5deg] z-20 shadow-2xl">COMIC RENDER</div>
                    <div className="aspect-video bg-zinc-900 border-4 md:border-[16px] border-black rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl transform group-hover:-rotate-1 transition-all duration-700 relative">
                       <img src={STYLE_EXAMPLES[0].img} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt="Comic Example" />
                       <div className="absolute inset-0 halftone opacity-20 pointer-events-none"></div>
                       <div className="absolute top-8 left-8">
                          <div className="comic-bubble text-sm md:text-2xl border-2 md:border-5 border-black shadow-[6px_6px_0px_#000]">
                            THE WORLD IS CHANGING...
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        <section id="how" className="bg-zinc-950 py-24 md:py-32 px-6 border-y-8 border-black relative overflow-hidden">
           <div className="absolute inset-0 halftone opacity-5 pointer-events-none"></div>
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16 md:mb-24">
                <h2 className="comic-font text-4xl md:text-8xl text-white italic uppercase leading-none mb-4">THE<br/><span className="text-amber-400">PROCESS</span></h2>
                <div className="w-24 h-2 bg-rose-700 mx-auto"></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
                {[
                  { step: "01", title: "THE DROP", text: "Upload your high-intensity video asset or YouTube link to the neural core.", color: "bg-rose-700" },
                  { step: "02", title: "THE SYNC", text: "Select your visual signature protocol from our curated comic art styles.", color: "bg-amber-400" },
                  { step: "03", title: "THE INK", text: "Gemini architecture analyzes temporal beats and renders a 6-panel masterpiece.", color: "bg-white" }
                ].map((s, i) => (
                  <div key={i} className="relative group">
                    <div className="bg-zinc-900 border-4 md:border-8 border-black p-8 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-[8px_8px_0px_#000] group-hover:shadow-[15px_15px_0px_#be123c] transition-all duration-500 group-hover:-translate-y-3">
                       <div className={`${s.color} ${i===1 ? 'text-black' : (i===2 ? 'text-black' : 'text-white')} absolute -top-8 left-1/2 -translate-x-1/2 px-5 py-2 comic-font text-3xl md:text-5xl border-4 border-black rotate-[-5deg] z-10 shadow-lg`}>{s.step}</div>
                       <h3 className="comic-font text-3xl md:text-5xl text-white mb-4 uppercase italic text-center drop-shadow-[2px_2px_0px_#000]">{s.title}</h3>
                       <p className="text-sm md:text-lg text-zinc-400 font-bold uppercase leading-relaxed text-center italic tracking-tight">{s.text}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </section>

        <footer className="bg-zinc-950 py-16 md:py-24 px-6 text-center border-t-8 border-black">
           <h1 className="comic-font text-3xl md:text-5xl text-white italic mb-8">CINE<span className="text-amber-400">COMIC</span></h1>
           <p className="text-zinc-800 font-black uppercase text-[8px] md:text-xs tracking-[1em] mb-4">PROTOCOL INK LABS • GLOBAL SECTOR ALPHA • © 2025</p>
           <div className="flex justify-center gap-6 text-zinc-600">
              <i className="fab fa-twitter text-2xl hover:text-rose-700 transition-colors cursor-pointer"></i>
              <i className="fab fa-instagram text-2xl hover:text-rose-700 transition-colors cursor-pointer"></i>
              <i className="fab fa-discord text-2xl hover:text-rose-700 transition-colors cursor-pointer"></i>
           </div>
        </footer>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-zinc-950 pb-32 view-fade-in relative selection:bg-rose-700 selection:text-white">
      <header className="py-4 md:py-6 px-4 md:px-12 border-b-4 border-black bg-zinc-900 flex justify-between items-center sticky top-0 z-[60]">
        <h1 onClick={() => triggerWipe(() => setState(s => ({ ...s, view: 'landing' })))} className="comic-font text-2xl md:text-4xl text-white italic cursor-pointer tracking-tighter">
          CINE<span className="text-amber-400">COMIC</span>
        </h1>
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Source Preview Widget */}
          {(state.videoPreviewUrl || state.youtubeUrl) && state.dashboardStep !== 'source' && (
             <div className="hidden lg:flex items-center gap-4 bg-black/60 border-2 border-zinc-800 p-1.5 rounded-2xl pr-6 shadow-xl animate-in fade-in slide-in-from-right-10">
                <div className="w-20 h-12 bg-black rounded-xl overflow-hidden relative border-2 border-zinc-700">
                   {state.videoPreviewUrl ? (
                      <video src={state.videoPreviewUrl} className="w-full h-full object-cover opacity-60" />
                   ) : (
                      <div className="w-full h-full bg-rose-900/40 flex items-center justify-center">
                         <i className="fab fa-youtube text-white text-xl"></i>
                      </div>
                   )}
                   <div className="absolute inset-0 halftone opacity-30"></div>
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] font-black uppercase text-zinc-500 leading-none mb-1">LIVE FEED SYNC</span>
                   <span className="comic-font text-sm text-white italic truncate max-w-[120px] uppercase">TARGET_ALPHA</span>
                </div>
             </div>
          )}
          
          <div className="text-right hidden sm:block cursor-pointer group" onClick={() => setShowBilling(true)}>
            <p className="text-amber-400 font-black italic text-lg md:text-2xl tracking-tighter leading-none group-hover:underline underline-offset-4">{state.user?.name}</p>
            <p className="text-[9px] md:text-[11px] font-black uppercase text-white/50 tracking-[0.2em] mt-1.5">{state.user?.credits} ENERGY CORES</p>
          </div>
          <div className="relative group">
            <img src={state.user?.avatarUrl} className="w-12 h-12 md:w-16 md:h-16 border-2 md:border-4 border-rose-700 rounded-xl md:rounded-2xl bg-white shadow-2xl cursor-pointer hover:scale-105 transition-transform" alt="Avatar" />
            <div className="absolute top-full right-0 mt-3 hidden group-hover:block bg-zinc-900 border-4 border-black p-3 rounded-2xl shadow-2xl min-w-[160px]">
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 comic-font text-xl text-white hover:text-rose-700 transition-colors uppercase italic">DE-LINK ACCOUNT</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-12 md:mt-16">
        {/* Welcome Bonus Claim UI */}
        {!state.hasClaimedWelcome && state.dashboardStep === 'source' && (
           <div className="mb-12 animate-in slide-in-from-top-10 duration-700">
             <div className="bg-rose-700 border-4 md:border-8 border-black p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-[12px_12px_0px_#000] relative overflow-hidden group">
                <div className="absolute inset-0 benday-dots opacity-10 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                   <div className="text-center md:text-left space-y-2">
                      <h3 className="comic-font text-3xl md:text-6xl text-white italic uppercase drop-shadow-[2px_2px_0px_#000]">RECRUITMENT BONUS!</h3>
                      <p className="text-amber-400 font-black uppercase text-xs md:text-lg tracking-widest italic">CLAIM 30 ENERGY CORES TO START YOUR MISSION</p>
                   </div>
                   <button 
                     onClick={handleClaimBonus}
                     className="bg-amber-400 text-black px-10 md:px-16 py-4 md:py-6 comic-font text-2xl md:text-5xl border-4 border-black shadow-[6px_6px_0px_#000] hover:scale-110 active:scale-95 transition-all uppercase italic"
                   >
                     CLAIM NOW!
                   </button>
                </div>
             </div>
           </div>
        )}

        {state.dashboardStep === 'source' && (
          <div className="space-y-10 md:space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="text-center">
              <h2 className="comic-font text-5xl md:text-8xl text-white uppercase italic leading-none drop-shadow-[4px_4px_0px_#be123c]">THE SOURCE</h2>
              <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs mt-4">PHASE 01: ASSET ACQUISITION</p>
            </div>
            <VideoUploader 
               onFileSelect={(f) => setState(s => ({ ...s, videoFile: f, youtubeUrl: null, videoPreviewUrl: f ? URL.createObjectURL(f) : null }))} 
               onUrlSelect={(u) => setState(s => ({ ...s, youtubeUrl: u, videoFile: null, videoPreviewUrl: null }))} 
               onDurationCapture={(d) => setState(s => ({ ...s, videoDuration: d }))} 
               previewUrl={state.videoPreviewUrl} 
               youtubeUrl={state.youtubeUrl} 
               disabled={false} 
            />
            {(state.videoFile || state.youtubeUrl) && (
              <div className="flex justify-center pt-6 md:pt-10">
                <button onClick={() => setState(s => ({ ...s, dashboardStep: 'style' }))} className="w-full md:w-auto bg-amber-400 px-12 md:px-24 py-6 md:py-8 comic-font text-3xl md:text-5xl border-4 md:border-8 border-black shadow-[10px_10px_0px_#000] hover:scale-105 active:scale-95 transition-all uppercase italic">SYNC PROTOCOL</button>
              </div>
            )}
          </div>
        )}

        {state.dashboardStep === 'style' && (
          <div className="space-y-10 md:space-y-16">
            <div className="text-center">
              <h2 className="comic-font text-5xl md:text-8xl text-white uppercase italic leading-none drop-shadow-[4px_4px_0px_#be123c]">ART PROTOCOL</h2>
              <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs mt-4">PHASE 02: VISUAL ENCODING</p>
            </div>
            <StylePicker selected={state.style!} onSelect={(s) => setState(prev => ({ ...prev, style: s }))} disabled={false} />
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
              <button onClick={() => setState(s => ({ ...s, dashboardStep: 'source' }))} className="w-full md:w-auto bg-zinc-800 text-white px-10 md:px-14 py-5 md:py-7 comic-font text-2xl md:text-4xl border-4 border-black shadow-lg hover:bg-zinc-700 transition-all uppercase italic">ABORT</button>
              {state.style && (
                <button onClick={() => setState(s => ({ ...s, dashboardStep: 'quality' }))} className="w-full md:w-auto bg-amber-400 px-12 md:px-24 py-6 md:py-8 comic-font text-3xl md:text-5xl border-4 md:border-8 border-black shadow-[10px_10px_0px_#000] hover:scale-105 active:scale-95 transition-all uppercase italic">CONFIRM STYLE</button>
              )}
            </div>
          </div>
        )}

        {state.dashboardStep === 'quality' && (
          <div className="space-y-10 md:space-y-16">
            <h2 className="comic-font text-5xl md:text-8xl text-white text-center uppercase italic leading-none drop-shadow-[4px_4px_0px_#be123c]">RENDER DEPTH</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {Object.values(QualityMode).map(m => (
                <button key={m} onClick={() => setState(s => ({ ...s, quality: m }))} className={`group p-8 md:p-14 border-4 md:border-8 border-black rounded-[2rem] md:rounded-[4rem] comic-font transition-all text-center relative overflow-hidden ${state.quality === m ? 'bg-amber-400 text-black scale-105 shadow-2xl' : 'bg-zinc-900 text-zinc-500 shadow-xl hover:text-white'}`}>
                  <div className="text-3xl md:text-5xl mb-3 md:mb-5 italic relative z-10">{m}</div>
                  <p className="text-[9px] md:text-[12px] font-black uppercase tracking-[0.3em] relative z-10">{m === 'ULTRA' ? 'MAX DEF' : m === 'STUDIO' ? 'HIGH FI' : 'FAST'}</p>
                  <div className="absolute inset-0 halftone opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
              <button onClick={() => setState(s => ({ ...s, dashboardStep: 'style' }))} className="w-full md:w-auto bg-zinc-800 text-white px-10 md:px-14 py-5 md:py-7 comic-font text-2xl md:text-4xl border-4 border-black shadow-lg hover:bg-zinc-700 transition-all uppercase italic">BACK</button>
              <button onClick={() => setState(s => ({ ...s, dashboardStep: 'summary' }))} className="w-full md:w-auto bg-amber-400 px-12 md:px-24 py-6 md:py-8 comic-font text-3xl md:text-5xl border-4 md:border-8 border-black shadow-[10px_10px_0px_#000] hover:scale-105 active:scale-95 transition-all uppercase italic">MISSION LOGS</button>
            </div>
          </div>
        )}

        {state.dashboardStep === 'summary' && (
          <div className="space-y-10 md:space-y-16">
            <h2 className="comic-font text-5xl md:text-8xl text-white text-center uppercase italic leading-none drop-shadow-[4px_4px_0px_#be123c]">MISSION LOGS</h2>
            <div className="max-w-4xl mx-auto bg-zinc-900 border-4 md:border-[12px] border-black p-8 md:p-16 rounded-[2.5rem] md:rounded-[5rem] shadow-[20px_20px_0px_#be123c] relative overflow-hidden">
              <div className="absolute inset-0 halftone opacity-10 pointer-events-none"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 relative z-10">
                <div className="space-y-4 md:space-y-6">
                   <div className="flex justify-between border-b-2 border-zinc-800 py-4"><span className="text-zinc-500 uppercase font-black text-xs md:text-sm tracking-widest">DURATION</span><span className="text-white font-black text-xl md:text-3xl">{state.videoDuration.toFixed(1)}s</span></div>
                   <div className="flex justify-between border-b-2 border-zinc-800 py-4"><span className="text-zinc-500 uppercase font-black text-xs md:text-sm tracking-widest">STYLE</span><span className="text-white font-black text-xl md:text-3xl truncate ml-6">{state.style?.split(' (')[0]}</span></div>
                   <div className="flex justify-between border-b-2 border-zinc-800 py-4"><span className="text-zinc-500 uppercase font-black text-xs md:text-sm tracking-widest">QUALITY</span><span className="text-white font-black text-xl md:text-3xl">{state.quality}</span></div>
                </div>
                <div className="bg-rose-700 p-10 md:p-14 rounded-[2rem] md:rounded-[3.5rem] border-4 md:border-8 border-black text-center flex flex-col justify-center shadow-2xl -rotate-2">
                  <p className="text-white font-black uppercase text-xs md:text-sm tracking-widest mb-2">CORE COST</p>
                  <h3 className="comic-font text-6xl md:text-9xl text-white leading-none drop-shadow-[6px_6px_0px_#000]">{calculateRequiredCredits()}</h3>
                </div>
              </div>
              <div className="flex flex-col gap-6 mt-12 md:mt-16">
                 <button onClick={startGeneration} className="w-full bg-amber-400 text-black py-8 md:py-14 comic-font text-4xl md:text-7xl border-4 md:border-8 border-black shadow-[12px_12px_0px_#000] hover:scale-[1.02] transition-all uppercase italic">EXECUTE MISSION</button>
                 <button onClick={() => setState(s => ({ ...s, dashboardStep: 'quality' }))} className="w-full text-zinc-500 font-black uppercase text-xs hover:text-white transition-colors py-2 tracking-[0.5em] italic">CHANGE PARAMETERS</button>
              </div>
            </div>
          </div>
        )}

        {state.dashboardStep === 'loading' && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-16 text-center relative overflow-hidden px-4">
            <div className="absolute inset-0 halftone opacity-10 pointer-events-none"></div>
            <div className="relative w-56 h-56 md:w-[28rem] md:h-[28rem] border-[20px] md:border-[35px] border-black rounded-full flex items-center justify-center shadow-[30px_30px_0px_#be123c] animate-pulse bg-zinc-900">
              <span className="comic-font text-6xl md:text-[14rem] text-white">INK</span>
              <div className="absolute inset-0 border-[20px] md:border-[35px] border-amber-400 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="comic-font text-5xl md:text-9xl text-white uppercase italic leading-none drop-shadow-[8px_8px_0px_#be123c]">REDRAWING REALITY...</h3>
            <p className="text-zinc-500 font-black uppercase tracking-[0.6em] text-[10px] md:text-lg animate-bounce">NEURAL ARCHITECTURE IS ENGAGED</p>
          </div>
        )}

        {state.dashboardStep === 'result' && (
          <div className="flex flex-col items-center py-8 md:py-12 space-y-10 md:space-y-16 animate-in slide-in-from-bottom-20 duration-1000 px-4">
            <div className="relative w-full max-w-[320px] sm:max-w-lg md:max-w-[40rem] aspect-[3/4] perspective-2000">
              {state.panels.map((p, idx) => {
                const offset = idx - activePanelIndex;
                if (offset < -1 || offset > 3) return null;
                return (
                  <div key={p.id} style={{ zIndex: 100 - idx, transform: `translateY(${offset * -20}px) scale(${1 - offset * 0.06}) translateZ(${offset * -120}px)`, opacity: offset < 0 ? 0 : 1 - offset * 0.35 }} className={`absolute inset-0 transition-all duration-700 cursor-pointer ${activePanelIndex === idx ? 'hover:scale-[1.01]' : ''}`} onClick={() => activePanelIndex === idx && activePanelIndex < state.panels.length - 1 && setActivePanelIndex(i => i + 1)}>
                    <ComicPanel panel={p} />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-8 md:gap-16 items-center">
              <button disabled={activePanelIndex === 0} onClick={() => setActivePanelIndex(i => i - 1)} className="w-20 h-20 md:w-32 md:h-32 bg-zinc-900 border-4 md:border-6 border-black rounded-full text-white text-3xl md:text-5xl shadow-2xl disabled:opacity-20 active:translate-y-2 transition-all hover:bg-zinc-800"><i className="fas fa-chevron-left"></i></button>
              <span className="comic-font text-4xl md:text-[10rem] text-white italic tracking-tighter leading-none">{activePanelIndex + 1}<span className="text-rose-700 mx-2">/</span>{state.panels.length}</span>
              <button disabled={activePanelIndex === state.panels.length - 1} onClick={() => setActivePanelIndex(i => i + 1)} className="w-20 h-20 md:w-32 md:h-32 bg-rose-700 border-4 md:border-6 border-black rounded-full text-white text-3xl md:text-5xl shadow-2xl disabled:opacity-20 active:translate-y-2 transition-all hover:bg-rose-600"><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-8 w-full max-w-5xl px-4">
              <button onClick={() => triggerWipe(() => { setActivePanelIndex(0); setState(s => ({ ...s, dashboardStep: 'source', panels: [], status: 'idle' })); })} className="w-full sm:flex-1 bg-zinc-900 text-white px-12 py-8 comic-font text-3xl md:text-5xl border-4 md:border-8 border-black shadow-[10px_10px_0px_#000] active:translate-y-2 transition-all uppercase italic">NEW MISSION</button>
            </div>
          </div>
        )}
      </main>

      {showBilling && <PricingModal onClose={() => setShowBilling(false)} credits={state.user?.credits || 0} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} onSubmit={() => {}} />}
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {state.view === 'landing' ? <LandingPage /> : 
       state.view === 'auth' ? (
         <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 selection:bg-rose-700 selection:text-white relative overflow-hidden">
            <div className="absolute inset-0 halftone opacity-10 pointer-events-none"></div>
            <div className="absolute top-10 left-[5%] comic-font text-8xl md:text-[20rem] text-rose-700/10 uppercase italic -rotate-12 select-none pointer-events-none">JOIN!</div>
            <div className="absolute bottom-10 right-[5%] comic-font text-8xl md:text-[20rem] text-amber-400/10 uppercase italic rotate-12 select-none pointer-events-none">NOW!</div>

            <form onSubmit={handleSignup} className="relative z-10 bg-zinc-900 border-4 md:border-[16px] border-black p-10 md:p-20 max-w-xl w-full rounded-[3rem] md:rounded-[6rem] text-center shadow-[20px_20px_0px_#be123c] md:shadow-[40px_40px_0px_#be123c] animate-in slide-in-from-bottom-10 duration-700 group">
              <div className="absolute -top-12 -right-12 transform rotate-12 hidden lg:block">
                 <div className="comic-bubble bg-amber-400 border-4 md:border-6 border-black px-10 py-6 shadow-2xl">
                   <p className="comic-font text-4xl text-black uppercase italic">NEW HERO?</p>
                 </div>
              </div>

              <div className="mb-10 md:mb-14">
                <h2 className="comic-font text-6xl md:text-[10rem] text-white uppercase italic tracking-tighter leading-none text-outline drop-shadow-[6px_6px_0px_#be123c]">RECRUIT</h2>
                <div className="h-2 w-32 bg-rose-700 mx-auto mt-4"></div>
              </div>

              <div className="space-y-10 text-left">
                <div className="relative transform -rotate-1">
                  <div className="absolute -left-6 -top-8 bg-rose-700 text-white px-6 py-2 comic-font text-3xl border-4 border-black rotate-[-10deg] z-20 shadow-lg">CODENAME</div>
                  <div className="bg-black border-4 md:border-6 border-black p-6 sm:p-8 rounded-3xl shadow-[8px_8px_0px_#000]">
                    <input required name="name" className="w-full bg-transparent text-white font-black text-2xl sm:text-3xl outline-none placeholder:text-zinc-900 uppercase tracking-tighter" placeholder="e.g. LOGAN" />
                  </div>
                </div>

                <div className="relative transform rotate-1">
                  <div className="absolute -left-6 -top-8 bg-amber-400 text-black px-6 py-2 comic-font text-3xl border-4 border-black rotate-[5deg] z-20 shadow-lg">ENCRYPTED MAIL</div>
                  <div className="bg-black border-4 md:border-6 border-black p-6 sm:p-8 rounded-3xl shadow-[8px_8px_0px_#000]">
                    <input required name="email" type="email" className="w-full bg-transparent text-white font-black text-2xl sm:text-3xl outline-none placeholder:text-zinc-900 uppercase tracking-tighter" placeholder="EMAIL@PROTOCOL.COM" />
                  </div>
                </div>

                <div className="pt-8">
                   <button className="w-full bg-rose-700 text-white p-8 md:p-12 comic-font text-4xl md:text-7xl border-4 md:border-[10px] border-black shadow-[12px_12px_0px_#000] hover:scale-105 active:scale-95 active:shadow-none transition-all italic uppercase relative overflow-hidden">
                      <span className="relative z-10">ENROLL NOW</span>
                      <div className="absolute inset-0 bg-white/10 translate-x-full hover:translate-x-0 transition-transform duration-500"></div>
                   </button>
                </div>
              </div>

              <button type="button" onClick={() => triggerWipe(() => setState(s => ({ ...s, view: 'landing' })))} className="mt-12 text-zinc-500 font-black uppercase text-xs md:text-sm hover:text-white transition-colors tracking-[0.5em] italic">
                <i className="fas fa-arrow-left mr-2"></i>ABORT MISSION
              </button>
            </form>
         </div>
       ) : state.view === 'onboarding' ? (
         <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 selection:bg-rose-700 selection:text-white">
           <div className="bg-zinc-900 border-4 md:border-[14px] border-black p-10 md:p-20 max-w-5xl w-full rounded-[4rem] md:rounded-[7rem] text-center shadow-[30px_30px_0px_#be123c] animate-in slide-in-from-bottom-10 duration-500">
             <h2 className="comic-font text-6xl md:text-[11rem] text-white mb-12 md:mb-20 uppercase italic leading-none text-outline drop-shadow-[8px_8px_0px_#be123c]">IDENT_LOG</h2>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
               {CURATED_PERSONAS.map(p => (
                 <button key={p.id} onClick={() => triggerWipe(() => setState(s => ({ ...s, view: 'dashboard', user: { ...s.user!, avatarUrl: p.url } })))} className="bg-zinc-800 border-4 md:border-6 border-black p-6 rounded-[2rem] md:rounded-[3rem] hover:bg-amber-400 group transition-all hover:scale-110 active:translate-y-2 shadow-2xl">
                   <img src={p.url} className="w-full aspect-square bg-white border-4 border-black rounded-[1.5rem] md:rounded-[2rem] mb-6" alt={p.name} />
                   <span className="comic-font text-2xl md:text-4xl text-white group-hover:text-black uppercase italic tracking-tighter">{p.name}</span>
                 </button>
               ))}
             </div>
           </div>
         </div>
       ) : renderDashboard()
      }
    </div>
  );
};

export default App;
