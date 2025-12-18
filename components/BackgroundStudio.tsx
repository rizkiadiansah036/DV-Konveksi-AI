
import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import { generateProductBackground } from '../services/geminiService';

interface BackgroundStudioProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBack: () => void;
}

const BackgroundStudio: React.FC<BackgroundStudioProps> = ({ theme, onToggleTheme, onBack }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeResultIdx, setActiveResultIdx] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState("Menunggu Input...");
  const [logs, setLogs] = useState<string[]>([]);
  
  // Interaction State for Zoom/Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      setError("Izin kamera ditolak atau tidak tersedia.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/png');
        setSourceImage(dataUrl);
        setResults([]);
        setActiveResultIdx(0);
        stopCamera();
        runAnalysis();
      }
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string);
        setResults([]);
        setActiveResultIdx(0);
        setError(null);
        runAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = () => {
    setIsScanning(true);
    setLogs([]);
    const stages = [
      "Mendeteksi Kategori Produk...",
      "Menganalisis Tekstur Kain...",
      "Menghitung Arah Pencahayaan...",
      "Sinkronisasi Perspektif Objek...",
      "Produk Siap Diproses"
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < stages.length) {
        setAnalysisStatus(stages[i]);
        setLogs(prev => [...prev, `[AI LOG]: ${stages[i]}`]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 500);
      }
    }, 450);
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;
    setIsGenerating(true);
    setCurrentProgress(1);
    setError(null);
    setResults([]); 
    setLogs([]);
    
    // Increased to 8 moods for "many visuals"
    const moods = [
      "High-End Studio White", 
      "Modern Urban Streetwear", 
      "Soft Natural Sunlight Garden", 
      "Cinematic Creative Neon",
      "Minimalist Abstract Geometry",
      "Luxury Wood & Leather Boutique",
      "Industrial Concrete Loft",
      "Vibrant Pop Culture Background"
    ];
    const statusMessages = [
      "Menganalisis Vibe Studio...",
      "Memetakan Konteks Urban...",
      "Menghasilkan Cahaya Alami...",
      "Merender Kontras Kreatif...",
      "Geometri Abstrak Minimalis...",
      "Konteks Butik Mewah...",
      "Gaya Industrial Modern...",
      "Palet Warna Pop Dinamis..."
    ];

    const generatedResults: string[] = [];
    const totalMoods = moods.length;

    try {
      for (let i = 0; i < totalMoods; i++) {
        setCurrentProgress(i + 1);
        setAnalysisStatus(statusMessages[i]);
        setLogs(prev => [...prev, `[GEN ${i+1}/${totalMoods}]: Rendering ${moods[i]}...`]);
        const result = await generateProductBackground(sourceImage, moods[i]);
        generatedResults.push(result);
        setResults([...generatedResults]);
        
        if (i === 0) {
          setActiveResultIdx(0);
          if (scrollContainerRef.current) {
             scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          }
        }
      }
    } catch (err) {
      setError("AI sedang menganalisis detail produk, silakan coba lagi.");
    } finally {
      setIsGenerating(false);
      setCurrentProgress(0);
      setAnalysisStatus("Proses Selesai");
      setLogs(prev => [...prev, `[OK]: ${generatedResults.length} Varian Berhasil Di-render.`]);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `DV-AI-Ads-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      // Index calc for snapping
      const index = Math.round(scrollLeft / (containerWidth * 0.75)); 
      if (index !== activeResultIdx && index >= 0 && index < results.length) {
        setActiveResultIdx(index);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    }
  };

  const toggleZoom = () => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2.5);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (zoom > 1 && e.buttons === 1) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      <Header theme={theme} onToggleTheme={onToggleTheme} onGoHome={onBack} />

      {isCameraOpen ? (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-md aspect-square overflow-hidden border-2 border-white/10 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-72 h-72 border border-white/30 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="mt-12 flex items-center gap-8">
            <button onClick={stopCamera} className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-red-500 transition-all"><i className="fas fa-times"></i></button>
            <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-90 transition-all"><div className="w-16 h-16 rounded-full border-4 border-slate-900 flex items-center justify-center"><div className="w-10 h-10 rounded-full bg-red-600"></div></div></button>
            <div className="w-14"></div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col overflow-hidden relative">
          
          <div className="flex-grow flex flex-col lg:flex-row">
            <aside className={`w-full lg:w-80 p-6 lg:p-8 lg:border-r space-y-8 flex-shrink-0 z-20 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Input Produk</h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                  <button onClick={startCamera} className={`p-5 rounded-2xl border transition-all flex items-center gap-4 group ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-red-500'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900 text-indigo-500' : 'bg-white text-red-600 shadow-sm'}`}>
                      <i className="fas fa-camera text-sm"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Kamera</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className={`p-5 rounded-2xl border transition-all flex items-center gap-4 group ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-red-500'}`}>
                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900 text-indigo-500' : 'bg-white text-red-600 shadow-sm'}`}>
                      <i className="fas fa-upload text-sm"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                  </button>
                </div>
              </div>

              {sourceImage && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                  <div className={`p-5 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-slate-800 bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'}`}>
                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase">AI akan merender 8 varian visual dengan beragam konteks profesional.</p>
                  </div>
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || isScanning}
                    className={`w-full py-5 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'} disabled:opacity-50`}
                  >
                    {isGenerating ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-sparkles"></i>}
                    {isGenerating ? `Merespons (${currentProgress}/8)` : 'Generate 8 Varian'}
                  </button>

                  <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'} font-mono text-[9px] h-32 overflow-y-auto no-scrollbar`}>
                    {logs.map((log, i) => (
                      <div key={i} className="mb-1 text-slate-500 truncate">{log}</div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-400 opacity-50 italic">AI System Ready...</div>}
                    <div className="w-1.5 h-3 bg-indigo-500 inline-block animate-pulse ml-1"></div>
                  </div>
                </div>
              )}
            </aside>

            <main className={`flex-grow relative flex flex-col items-center justify-center py-6 md:py-10 overflow-hidden ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:40px_40px] opacity-10 pointer-events-none"></div>
              
              {!sourceImage ? (
                <div className="text-center space-y-6 max-w-sm animate-in zoom-in-95 duration-700">
                  <div className={`w-28 h-28 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-8 ${theme === 'dark' ? 'bg-slate-900 text-indigo-500 border border-slate-800 shadow-2xl' : 'bg-white text-red-600 border border-slate-100 shadow-xl'}`}>
                    <i className="fas fa-wand-magic-sparkles"></i>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">AI Background Studio</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">Generate Commercial Visuals</p>
                </div>
              ) : results.length === 0 ? (
                <div className="relative w-full max-w-xl aspect-square overflow-hidden shadow-2xl bg-black border border-slate-200 dark:border-slate-800 mx-6">
                  <img src={sourceImage} className={`w-full h-full object-cover transition-all duration-700 ${isScanning ? 'opacity-50 scale-110' : 'opacity-100'}`} alt="Preview" />
                  
                  {(isScanning || isGenerating) && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                      {/* Grid Scanning Effect */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                         <div className="w-full h-full border border-indigo-500/30 grid grid-cols-8 grid-rows-8">
                           {Array.from({length: 64}).map((_, i) => <div key={i} className="border border-indigo-500/10"></div>)}
                         </div>
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,1)] animate-scan"></div>
                      </div>

                      <div className="relative mb-6">
                         <div className="w-20 h-20 rounded-full border-4 border-white/5 flex items-center justify-center">
                           <div className="w-16 h-16 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                         </div>
                         <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fas fa-microchip text-white text-xl animate-pulse"></i>
                         </div>
                      </div>
                      <div className="px-10 py-4 bg-black/90 rounded-2xl border border-white/10 shadow-2xl max-w-[80%] text-center">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white whitespace-nowrap mb-2">
                          {analysisStatus}
                        </p>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: isScanning ? '40%' : `${(currentProgress / 8) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  
                  <div className="relative w-full overflow-hidden touch-pan-x">
                    <div 
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-[15%] py-6 gap-6 items-center h-[480px] md:h-[550px]"
                    >
                      {results.map((res, idx) => {
                        const isFocused = idx === activeResultIdx;
                        return (
                          <div 
                            key={idx}
                            className={`flex-shrink-0 w-[70vw] md:w-[500px] aspect-square snap-center transition-all duration-500 ease-out transform
                              ${isFocused ? 'scale-100 opacity-100 z-20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]' : 'scale-90 opacity-40 z-10'}`}
                          >
                            <div 
                              className={`relative w-full h-full overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 ${isFocused ? 'cursor-zoom-in' : ''}`}
                              onClick={() => isFocused && toggleZoom()}
                              onPointerMove={isFocused ? handlePointerMove : undefined}
                            >
                                <img 
                                  src={res} 
                                  className="w-full h-full object-cover transition-transform duration-200 select-none" 
                                  style={{ 
                                    transform: isFocused ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` : 'none',
                                    pointerEvents: zoom > 1 ? 'auto' : 'none'
                                  }}
                                  alt={`Result ${idx}`} 
                                  draggable={false}
                                />
                                
                                {isFocused && (
                                  <>
                                    <div className="absolute top-6 left-6 flex gap-2">
                                       <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase rounded-lg border border-white/10">
                                          HD Visual #{idx + 1}
                                       </span>
                                    </div>
                                    <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); downloadImage(res); }} 
                                        className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
                                      >
                                        <i className="fas fa-download text-lg"></i>
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); toggleZoom(); }} 
                                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 ${zoom > 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}
                                      >
                                        <i className={`fas ${zoom > 1 ? 'fa-magnifying-glass-minus' : 'fa-magnifying-glass-plus'} text-lg`}></i>
                                      </button>
                                    </div>
                                  </>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col items-center w-full px-8 gap-6 z-40 mt-4">
                    <div className="flex gap-4">
                      {results.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeResultIdx ? 'w-10 bg-indigo-500' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
                        />
                      ))}
                    </div>

                    <div className="text-center animate-in fade-in duration-500">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center justify-center gap-3">
                        <i className="fas fa-microchip text-[10px] text-indigo-500"></i>
                        {results.length} Variasi Visual Tersedia
                      </p>
                      <p className="text-[8px] font-bold text-indigo-500/60 uppercase tracking-widest mt-2">Swipe untuk eksplorasi • Zoom untuk detail tekstur</p>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>

          {error && (
            <div className="fixed bottom-24 left-6 right-6 lg:left-auto lg:right-12 lg:w-80 z-50 p-5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl border border-red-100 shadow-xl flex items-center gap-4">
              <i className="fas fa-exclamation-triangle text-lg"></i>
              <p className="leading-tight">{error}</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .snap-x {
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BackgroundStudio;
