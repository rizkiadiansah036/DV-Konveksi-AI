
import React, { useRef, useState, useEffect } from 'react';
import { DesignState } from '../types';
import { enhanceFinalImage } from '../services/geminiService';

interface ExportModalProps {
  state: DesignState;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ state, theme, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drawToCanvas = async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return '';

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        if (!src.startsWith('data:')) img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Gagal memuat gambar"));
        img.src = src;
      });
    };

    const mockupImg = await loadImage(state.mockupUrl);
    const exportScale = 2; 
    canvas.width = mockupImg.width * exportScale;
    canvas.height = mockupImg.height * exportScale;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);

    if (state.designUrl) {
      const designImg = await loadImage(state.designUrl);
      const aspect = designImg.width / designImg.height;
      const dw = canvas.width * state.scale;
      const dh = dw / aspect;
      const dx = canvas.width * state.pos.x;
      const dy = canvas.height * state.pos.y;

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate((state.rotation * Math.PI) / 180);
      if (state.flipX) ctx.scale(-1, 1);
      ctx.globalAlpha = state.opacity;
      ctx.drawImage(designImg, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    return canvas.toDataURL('image/png', 1.0);
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setError(null);
    try {
      const baseSnapshot = await drawToCanvas();
      const result = await enhanceFinalImage(baseSnapshot, "1:1");
      setEnhancedUrl(result);
    } catch (err: any) {
      setError("AI sedang sibuk. Coba lagi nanti.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    setIsRendering(true);
    try {
      const finalDataUrl = enhancedUrl || await drawToCanvas();
      const link = document.createElement('a');
      link.download = `DV-Konveksi-Final-${Date.now()}.${format}`;
      link.href = finalDataUrl;
      link.click();
    } catch (err) {
      alert("Gagal merender.");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300 no-scrollbar">
      <div className={`relative w-full max-w-6xl md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl transition-all ${theme === 'dark' ? 'bg-slate-900' : 'bg-white md:rounded-[3rem]'}`}>
        
        <button onClick={onClose} className={`absolute top-6 right-6 z-[110] w-12 h-12 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-red-500 hover:text-white' : 'bg-slate-100 text-slate-900 hover:bg-red-500 hover:text-white'}`}>
          <i className="fas fa-times"></i>
        </button>

        <div className={`relative flex-[1.2] flex items-center justify-center p-6 md:p-12 transition-colors ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
          <div className="relative w-full aspect-square bg-white rounded-3xl p-3 shadow-2xl border-2 border-white/40 overflow-hidden">
            <img src={enhancedUrl || (state.designUrl ? state.mockupUrl : state.mockupUrl)} className="w-full h-full object-contain" alt="Final Preview" />
            {enhancedUrl && (
              <span className="absolute top-6 right-6 px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full animate-bounce">
                AI HD Enhanced
              </span>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className={`flex-1 flex flex-col h-full overflow-y-auto no-scrollbar transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
          <div className="p-8 md:p-12 flex flex-col h-full">
            <div className="mb-10">
              <h2 className={`text-3xl font-black uppercase tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Review Produk</h2>
              <p className="text-xs text-slate-500">Gunakan AI High Definition untuk kualitas premium.</p>
            </div>

            <div className="space-y-4 mb-10">
               {!enhancedUrl && (
                <button onClick={handleEnhance} disabled={isEnhancing} className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-4 ${theme === 'dark' ? 'bg-slate-800 border border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-red-50 border-2 border-red-100 text-red-600 hover:bg-red-100'}`}>
                  {isEnhancing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sparkles"></i>}
                  Perjelas dengan AI HD
                </button>
               )}
            </div>

            <div className="space-y-4 mb-auto">
              <button onClick={() => handleDownload('png')} disabled={isRendering} className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                Unduh Desain (PNG)
              </button>
              <button onClick={() => handleDownload('jpg')} className={`w-full py-5 border-2 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-4 ${theme === 'dark' ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:border-red-500'}`}>
                Simpan JPEG
              </button>
            </div>

            <button onClick={onClose} className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500">
              Kembali ke Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
