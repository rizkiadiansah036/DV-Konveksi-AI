
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Header from './components/Header';
import MockupSelector from './components/MockupSelector';
import DesignCanvas from './components/DesignCanvas';
import ExportModal from './components/ExportModal';
import LandingPage from './components/LandingPage';
import BackgroundStudio from './components/BackgroundStudio';
import { DEFAULT_MOCKUPS } from './constants';
import { DesignState, ImageSize, AppView } from './types';
import { generateMockup, removeDesignBackground, refineRealisticDesign } from './services/geminiService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<AppView>('landing');
  const [activeTab, setActiveTab] = useState<'katalog' | 'studio'>('katalog');
  const [isToolsVisible, setIsToolsVisible] = useState(true);
  const [state, setState] = useState<DesignState>({
    type: 'T-Shirt',
    color: 'Hitam',
    prompt: '',
    specs: null,
    mockupUrl: DEFAULT_MOCKUPS[0].url,
    designUrl: null,
    isGenerating: false,
    isUserUploaded: false,
    imageSize: '1K',
    rotation: 0,
    opacity: 1,
    flipX: false,
    scale: 0.25,
    pos: { x: 0.5, y: 0.45 }
  });

  const [backupState, setBackupState] = useState<DesignState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [activeMobileSlider, setActiveMobileSlider] = useState<'scale' | 'rotation' | 'opacity' | null>(null);
  const [isInteractingUI, setIsInteractingUI] = useState(false);

  const canvasComponentRef = useRef<any>(null);

  // Desktop Panel Dragging
  const [panelPos, setPanelPos] = useState({ x: window.innerWidth - 380, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Mobile Floating Dock State
  const [mobilePos, setMobilePos] = useState({ x: 20, y: window.innerHeight - 480 });
  const [mobileScale, setMobileScale] = useState(0.85);
  const dragData = useRef({ 
    isDragging: false, 
    offsetX: 0, 
    offsetY: 0,
    isPinching: false,
    startDist: 0,
    startScale: 0.85
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleGoHome = () => setView('landing');

  const handleMockupChange = (url: string, isUserUploaded: boolean) => {
    setState(prev => ({ ...prev, mockupUrl: url, isUserUploaded }));
    setBackupState(null);
  };

  const handleDesignUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setState(prev => ({ ...prev, designUrl: e.target.result as string }));
          setShowControls(true);
          setIsToolsVisible(true);
          setActiveTab('studio');
          setBackupState(null);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; 
  };

  const handleRemoveBackground = async () => {
    if (!state.designUrl) return;
    setIsRemovingBg(true);
    setError(null);
    try {
      const cleanedUrl = await removeDesignBackground(state.designUrl);
      setState(prev => ({ ...prev, designUrl: cleanedUrl }));
    } catch (err: any) {
      setError("Gagal menghapus background.");
    } finally {
      setIsRemovingBg(false);
      setIsInteractingUI(false); 
    }
  };

  const handleDownloadDesignOnly = (e?: React.MouseEvent | React.PointerEvent) => {
    e?.stopPropagation();
    if (!state.designUrl) return;
    const link = document.createElement('a');
    link.href = state.designUrl;
    link.download = `DV-Desain-Clean-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsInteractingUI(false);
  };

  const handleAIRealisticBlend = async () => {
    if (!canvasComponentRef.current) return;
    setIsRefining(true);
    setError(null);
    try {
      const stateToBackup = { ...state };
      setBackupState(stateToBackup);
      
      const { snapshot } = canvasComponentRef.current.getDetailedSnapshot();
      const refinedUrl = await refineRealisticDesign(snapshot, "1:1");
      
      setState(prev => ({ 
        ...prev, 
        mockupUrl: refinedUrl, 
        designUrl: null, 
        isUserUploaded: true 
      }));
      setShowControls(false); 
    } catch (err: any) {
      setError("Gagal AI Blend.");
      setBackupState(null);
    } finally {
      setIsRefining(false);
    }
  };

  const handleUndoRefinement = () => {
    if (backupState) {
      setState(backupState);
      setBackupState(null);
      setShowControls(true);
      setIsToolsVisible(true);
    }
  };

  const handleGenerate = async () => {
    if (!state.prompt.trim()) return setError("Isi deskripsi.");
    const hasKey = await window.aistudio?.hasSelectedApiKey();
    if (!hasKey) await window.aistudio?.openSelectKey();
    setError(null);
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const url = await generateMockup(state.type, state.color, state.prompt, state.imageSize);
      setState(prev => ({ ...prev, mockupUrl: url, isUserUploaded: true, isGenerating: false }));
      if (window.innerWidth < 1024) setActiveTab('studio');
    } catch (err: any) {
      setError("Gagal generate.");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // DESKTOP DRAG
  const startDesktopDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: panelPos.x,
      initialY: panelPos.y
    };
  };

  // MOBILE DRAG
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragData.current.isDragging = true;
    dragData.current.offsetX = e.clientX - mobilePos.x;
    dragData.current.offsetY = e.clientY - mobilePos.y;
    setIsInteractingUI(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragData.current.isDragging || dragData.current.isPinching) return;
    setMobilePos({
      x: e.clientX - dragData.current.offsetX,
      y: e.clientY - dragData.current.offsetY
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragData.current.isDragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsInteractingUI(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsInteractingUI(true);
    if (e.touches.length === 2) {
      dragData.current.isPinching = true;
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      dragData.current.startDist = dist;
      dragData.current.startScale = mobileScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragData.current.isPinching && e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const factor = dist / dragData.current.startDist;
      const newScale = Math.max(0.4, Math.min(1.2, dragData.current.startScale * factor));
      setMobileScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    dragData.current.isPinching = false;
    if (!dragData.current.isDragging) setIsInteractingUI(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPanelPos({ 
        x: Math.max(10, Math.min(window.innerWidth - 350, dragRef.current.initialX + (e.clientX - dragRef.current.startX))),
        y: Math.max(10, Math.min(window.innerHeight - 80, dragRef.current.initialY + (e.clientY - dragRef.current.startY)))
      });
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const controlItems = [
    { label: 'Ukuran', icon: 'fa-maximize', value: state.scale, min: 0.05, max: 0.8, step: 0.01, display: Math.round(state.scale * 100) + '%', field: 'scale' },
    { label: 'Rotasi', icon: 'fa-rotate', value: state.rotation, min: 0, max: 360, step: 1, display: state.rotation + '°', field: 'rotation' },
    { label: 'Opasitas', icon: 'fa-circle-half-stroke', value: state.opacity, min: 0.1, max: 1.0, step: 0.01, display: Math.round(state.opacity * 100) + '%', field: 'opacity' }
  ];

  if (view === 'landing') {
    return <LandingPage theme={theme} onStart={() => setView('editor')} onStartBackgroundStudio={() => setView('bg-studio')} onToggleTheme={toggleTheme} />;
  }

  if (view === 'bg-studio') {
    return <BackgroundStudio theme={theme} onToggleTheme={toggleTheme} onBack={handleGoHome} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} select-none overflow-x-hidden no-scrollbar`}>
      <Header theme={theme} onToggleTheme={toggleTheme} onGoHome={handleGoHome} />

      <main className="flex-grow max-w-7xl mx-auto w-full px-0 md:px-6 lg:px-8 py-0 lg:py-8 relative pb-32 lg:pb-8 no-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in fade-in duration-500">
          
          <aside className={`lg:col-span-4 space-y-6 ${activeTab === 'katalog' ? 'block' : 'hidden lg:block'} px-4 lg:px-0 pt-6`}>
            <div className={`rounded-[2.5rem] p-8 shadow-2xl transition-all border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-indigo-500/5' : 'bg-white border-slate-100 shadow-slate-200/50'} sticky top-24`}>
              <h2 className={`text-sm font-black mb-8 flex items-center gap-3 uppercase tracking-widest ${theme === 'dark' ? 'text-indigo-400' : 'text-red-600'}`}>
                <i className="fas fa-layer-group"></i> KATALOG
              </h2>
              <div className="space-y-8">
                <MockupSelector selectedUrl={state.mockupUrl} theme={theme} onSelect={handleMockupChange} />
                <div className={`h-px ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`} />
                <div className="space-y-4">
                   <input type="file" accept="image/*" className="hidden" id="upload-artwork" onChange={handleDesignUpload} />
                   <label htmlFor="upload-artwork" className={`flex items-center justify-center gap-4 p-5 border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${theme === 'dark' ? 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800' : 'border-slate-200 hover:border-red-400 hover:bg-red-50/30'}`}>
                    <i className={`fas fa-file-arrow-up text-xl ${theme === 'dark' ? 'text-slate-600 group-hover:text-indigo-400' : 'text-slate-300 group-hover:text-red-500'}`}></i>
                    <span className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Upload Desain</span>
                  </label>
                </div>
                <div className="space-y-4">
                  <textarea value={state.prompt} onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))} placeholder="Contoh: Tambahkan pattern batik merah..." className={`w-full h-24 p-5 rounded-2xl text-xs outline-none resize-none transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:ring-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:ring-red-500'}`} />
                  <button onClick={handleGenerate} disabled={state.isGenerating} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                    {state.isGenerating ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                    Buat Desain AI
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className={`lg:col-span-8 ${activeTab === 'studio' ? 'block' : 'hidden lg:block'} flex flex-col h-full`}>
            <div className={`lg:rounded-[3rem] flex flex-col h-full overflow-hidden min-h-[calc(100vh-180px)] relative transition-all border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} shadow-2xl shadow-slate-200/50`}>
              <div className={`px-8 py-5 border-b flex justify-between items-center z-10 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/90' : 'border-slate-50 bg-white/90'} backdrop-blur-md`}>
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${theme === 'dark' ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Studio</h3>
                </div>
                <div className="flex items-center gap-2">
                  {(state.designUrl || backupState) && (
                    <button 
                      onClick={() => setIsToolsVisible(!isToolsVisible)} 
                      className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${theme === 'dark' ? 'bg-slate-800 text-indigo-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-red-600 border-slate-200 hover:bg-slate-200'}`}
                    >
                      <i className={`fas ${isToolsVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      {isToolsVisible ? 'Sembunyikan Alat' : 'Alat'}
                    </button>
                  )}
                  {backupState && (
                    <button onClick={handleUndoRefinement} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border shadow-lg ${theme === 'dark' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50 hover:bg-indigo-600/40' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}><i className="fas fa-rotate-left"></i> Edit Kembali</button>
                  )}
                </div>
              </div>

              <div className={`flex-grow relative flex items-center justify-center p-6 md:p-12 overflow-hidden transition-colors ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50/30'}`}>
                <DesignCanvas 
                  ref={canvasComponentRef}
                  mockupUrl={state.mockupUrl}
                  designUrl={state.designUrl}
                  isGenerating={state.isGenerating || isRefining}
                  rotation={state.rotation}
                  opacity={state.opacity}
                  flipX={state.flipX}
                  scale={state.scale}
                  pos={state.pos}
                  onUpdatePos={(newPos) => setState(prev => ({ ...prev, pos: newPos }))}
                  onUpdateScale={(newScale) => setState(prev => ({ ...prev, scale: newScale }))}
                  onUpdateRotation={(newRotation) => setState(prev => ({ ...prev, rotation: newRotation }))}
                  theme={theme}
                />
                
                <div className="hidden lg:block absolute bottom-12 right-12">
                  <button onClick={() => setShowExport(true)} className={`px-12 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center gap-4 group ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                    <i className="fas fa-download group-hover:translate-y-1 transition-transform"></i> Siapkan Produk
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DESKTOP STUDIO TOOLS */}
      {showControls && isToolsVisible && state.designUrl && !state.isGenerating && (
        <div style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px`, width: '340px' }} onMouseDown={startDesktopDrag} className="hidden lg:block fixed z-[100] cursor-grab active:cursor-grabbing">
          <div className={`rounded-[2.5rem] p-7 shadow-2xl border transition-all duration-300 ${isInteractingUI ? 'opacity-40 scale-95 blur-sm' : 'opacity-100 scale-100'} ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/90 border-slate-100 text-slate-900'} backdrop-blur-2xl`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Studio Tools</span>
              <div className="flex gap-2">
                <button onClick={() => setState(prev => ({ ...prev, flipX: !prev.flipX }))} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${state.flipX ? (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white') : (theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-400')}`} title="Flip Horizontal"><i className="fas fa-right-left text-[10px]"></i></button>
                <button onClick={handleRemoveBackground} disabled={isRemovingBg} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-white border-slate-100 text-red-600'}`} title="Hapus Background Desain"><i className={`fas ${isRemovingBg ? 'fa-spinner fa-spin' : 'fa-eraser'} text-[10px]`}></i></button>
                <button onClick={() => handleDownloadDesignOnly()} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`} title="Download Desain Saja"><i className="fas fa-file-download text-[10px]"></i></button>
              </div>
            </div>
            <div className="space-y-6">
              {controlItems.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>{item.label}</span><span className={`${theme === 'dark' ? 'text-indigo-400' : 'text-red-600'} font-mono`}>{item.display}</span></div>
                  <input type="range" min={item.min} max={item.max} step={item.step} value={item.value} onMouseDown={() => setIsInteractingUI(true)} onMouseUp={() => setIsInteractingUI(false)} onChange={(e) => setState(prev => ({...prev, [item.field]: parseFloat(e.target.value)}))} className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:appearance-none`} />
                </div>
              ))}
              <button onClick={handleAIRealisticBlend} disabled={isRefining} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                {isRefining ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>} AI Realistic Blend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STUDIO TOOLS (FLOATING DOCK) */}
      {activeTab === 'studio' && isToolsVisible && state.designUrl && !state.isGenerating && (
        <div 
          style={{ 
            left: `${mobilePos.x}px`, 
            top: `${mobilePos.y}px`, 
            width: '280px',
            transform: `scale(${mobileScale})`,
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="lg:hidden fixed z-[100] animate-in zoom-in-90 duration-300"
        >
          <div className={`rounded-[3rem] p-6 shadow-2xl border relative transition-all duration-300 ${isInteractingUI ? 'opacity-30 blur-sm scale-95' : 'opacity-100 scale-100'} ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-white'} backdrop-blur-3xl`}>
            <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center">
              <div className={`w-12 h-1 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
            </div>
            <div className="pt-4">
              <div className="flex justify-between items-center mb-5">
                <span className={`text-[11px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-indigo-400' : 'text-red-600'}`}>Studio Tools</span>
                <div className="flex gap-2">
                  <button onClick={() => setState(prev => ({...prev, flipX: !prev.flipX}))} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${state.flipX ? (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white') : (theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400')}`}><i className="fas fa-right-left text-xs"></i></button>
                  <button onClick={handleRemoveBackground} disabled={isRemovingBg} className={`w-9 h-9 rounded-xl border flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-slate-50 border-slate-100 text-red-600'}`}><i className={`fas ${isRemovingBg ? 'fa-spinner fa-spin' : 'fa-eraser'} text-xs`}></i></button>
                  <button onClick={() => handleDownloadDesignOnly()} className={`w-9 h-9 rounded-xl border flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><i className="fas fa-file-download text-xs"></i></button>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                {controlItems.map((item) => (
                  <button key={item.label} onClick={() => setActiveMobileSlider(activeMobileSlider === item.field ? null : item.field as any)} className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${activeMobileSlider === item.field ? (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white') : (theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400')}`}>
                    <i className={`fas ${item.icon} text-base`}></i>
                    <span className="text-[8px] font-black uppercase">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className={`transition-all duration-300 overflow-hidden ${activeMobileSlider ? 'max-h-24 opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
                {activeMobileSlider && (
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <input type="range" min={activeMobileSlider === 'scale' ? 0.05 : activeMobileSlider === 'rotation' ? 0 : 0.1} max={activeMobileSlider === 'scale' ? 0.8 : activeMobileSlider === 'rotation' ? 360 : 1.0} step={activeMobileSlider === 'rotation' ? 1 : 0.01} value={state[activeMobileSlider as keyof DesignState] as number} onPointerDown={() => setIsInteractingUI(true)} onPointerUp={() => setIsInteractingUI(false)} onChange={(e) => setState(prev => ({ ...prev, [activeMobileSlider]: parseFloat(e.target.value) }))} className="w-full h-2 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-indigo-600" />
                  </div>
                )}
              </div>

              <button onClick={handleAIRealisticBlend} disabled={isRefining} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'}`}>
                {isRefining ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sparkles"></i>} AI Realistic Blend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MAIN NAV - FIXED AT BOTTOM */}
      <nav className={`lg:hidden fixed bottom-6 left-6 right-6 h-18 shadow-2xl rounded-[2.5rem] flex items-center justify-around px-8 z-[70] border transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-indigo-500/10' : 'bg-white border-slate-100 shadow-slate-200/40'}`}>
        <button onClick={() => setActiveTab('katalog')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'katalog' ? (theme === 'dark' ? 'text-indigo-400' : 'text-red-600') : 'text-slate-400'}`}>
          <i className="fas fa-layer-group text-lg"></i>
          <span className="text-[8px] font-black uppercase">KATALOG</span>
        </button>
        <div className="relative -top-7">
          <button onClick={() => { if (activeTab === 'studio') setShowExport(true); else setActiveTab('studio'); }} className={`w-18 h-18 rounded-full shadow-2xl flex items-center justify-center border-[3px] transition-all ${theme === 'dark' ? 'border-slate-950 bg-indigo-600' : 'border-slate-50 bg-red-600'}`}>
            <i className={`fas ${activeTab === 'studio' ? 'fa-download' : 'fa-wand-magic-sparkles'} text-white text-2xl`}></i>
          </button>
        </div>
        <button onClick={() => setActiveTab('studio')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'studio' ? (theme === 'dark' ? 'text-indigo-400' : 'text-red-600') : 'text-slate-400'}`}>
          <i className="fas fa-palette text-lg"></i>
          <span className="text-[8px] font-black uppercase">Studio Tools</span>
        </button>
      </nav>

      {showExport && <ExportModal state={state} theme={theme} onClose={() => setShowExport(false)} />}
    </div>
  );
};

export default App;
