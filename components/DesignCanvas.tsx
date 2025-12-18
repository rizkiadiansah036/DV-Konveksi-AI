
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { PrintArea } from '../types';

interface DesignCanvasProps {
  mockupUrl: string;
  designUrl: string | null;
  isGenerating: boolean;
  rotation: number;
  opacity: number;
  flipX: boolean;
  scale: number;
  pos: { x: number, y: number };
  onUpdatePos: (newPos: { x: number, y: number }) => void;
  onUpdateScale: (newScale: number) => void;
  onUpdateRotation: (newRotation: number) => void;
  printArea?: PrintArea;
  // Added theme prop to match usage in App.tsx
  theme: 'light' | 'dark';
}

const DesignCanvas = forwardRef<any, DesignCanvasProps>(({ 
  mockupUrl, designUrl, isGenerating, rotation, opacity, flipX, scale, pos, 
  onUpdatePos, onUpdateScale, onUpdateRotation, printArea, theme 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  const gestureRef = useRef({
    initialDist: 0,
    initialScale: 0,
    initialAngle: 0,
    initialRotation: 0,
    lastX: 0,
    lastY: 0
  });

  const images = useRef<{ mockup: HTMLImageElement | null; design: HTMLImageElement | null }>({
    mockup: null,
    design: null
  });

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      return canvasRef.current?.toDataURL('image/png', 1.0);
    },
    getDetailedSnapshot: () => {
      if (!canvasRef.current) return { snapshot: '', width: 1000, height: 1000 };
      return {
        snapshot: canvasRef.current.toDataURL('image/png', 1.0),
        width: canvasRef.current.width,
        height: canvasRef.current.height
      };
    }
  }));

  useEffect(() => {
    setIsCanvasReady(false);
    const mockupImg = new Image();
    mockupImg.crossOrigin = "anonymous";
    mockupImg.src = mockupUrl;
    mockupImg.onload = () => {
      images.current.mockup = mockupImg;
      setAspectRatio(mockupImg.width / mockupImg.height);
      if (canvasRef.current) {
        canvasRef.current.width = mockupImg.width;
        canvasRef.current.height = mockupImg.height;
      }
      setIsCanvasReady(true);
      draw();
    };
    mockupImg.onerror = () => {
      console.error("Gagal memuat mockup utama.");
      setIsCanvasReady(true);
    };

    if (designUrl) {
      const designImg = new Image();
      designImg.crossOrigin = "anonymous";
      designImg.src = designUrl;
      designImg.onload = () => {
        images.current.design = designImg;
        draw();
      };
    } else {
      images.current.design = null;
      draw();
    }
  }, [mockupUrl, designUrl]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !images.current.mockup) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Mockup
    ctx.drawImage(images.current.mockup, 0, 0, canvas.width, canvas.height);

    // Draw Design Overlay
    if (images.current.design && !isGenerating) {
      const d = images.current.design;
      const designAspect = d.width / d.height;
      const dw = canvas.width * scale;
      const dh = dw / designAspect;
      const dx = (canvas.width * pos.x);
      const dy = (canvas.height * pos.y);

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipX) ctx.scale(-1, 1);
      ctx.globalAlpha = opacity;
      
      // Shadow tipis untuk memberikan volume awal sebelum diproses AI
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      
      ctx.drawImage(d, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }
  };

  useEffect(() => { draw(); }, [pos, scale, rotation, opacity, flipX, isGenerating, isCanvasReady]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!designUrl) return;
    setIsInteracting(true);
    if (e.touches.length === 1) {
      gestureRef.current.lastX = e.touches[0].clientX;
      gestureRef.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const angle = Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX) * 180 / Math.PI;
      gestureRef.current.initialDist = dist;
      gestureRef.current.initialScale = scale;
      gestureRef.current.initialAngle = angle;
      gestureRef.current.initialRotation = rotation;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isInteracting || !canvasRef.current) return;
    if (e.touches.length === 1) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = (e.touches[0].clientX - gestureRef.current.lastX) / rect.width;
      const dy = (e.touches[0].clientY - gestureRef.current.lastY) / rect.height;
      onUpdatePos({ x: Math.max(0, Math.min(1, pos.x + dx)), y: Math.max(0, Math.min(1, pos.y + dy)) });
      gestureRef.current.lastX = e.touches[0].clientX;
      gestureRef.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const angle = Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX) * 180 / Math.PI;
      onUpdateScale(Math.max(0.05, Math.min(0.8, gestureRef.current.initialScale * (dist / gestureRef.current.initialDist))));
      onUpdateRotation((gestureRef.current.initialRotation + (angle - gestureRef.current.initialAngle) + 360) % 360);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[600px] flex flex-col items-center">
      <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>
      
      <div 
        className="relative w-full overflow-hidden shadow-[0_60px_100px_-20px_rgba(0,0,0,0.2)] bg-white rounded-[2.5rem] border-[16px] border-white ring-1 ring-slate-100 touch-none flex items-center justify-center min-h-[400px]"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full cursor-move transition-opacity duration-500 ${isCanvasReady ? 'opacity-100' : 'opacity-0'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsInteracting(false)}
          onMouseDown={(e) => {
            if (!designUrl) return;
            setIsInteracting(true);
            gestureRef.current.lastX = e.clientX;
            gestureRef.current.lastY = e.clientY;
          }}
          onMouseMove={(e) => {
            if (!isInteracting || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            onUpdatePos({
              x: Math.max(0, Math.min(1, pos.x + (e.clientX - gestureRef.current.lastX) / rect.width)),
              y: Math.max(0, Math.min(1, pos.y + (e.clientY - gestureRef.current.lastY) / rect.height))
            });
            gestureRef.current.lastX = e.clientX;
            gestureRef.current.lastY = e.clientY;
          }}
          onMouseUp={() => setIsInteracting(false)}
        />
        
        {!isCanvasReady && (
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
             <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Memuat Visual...</p>
           </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-14 h-14 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="mt-5 font-black text-indigo-900 text-[11px] tracking-[0.4em] uppercase animate-pulse">Memproses Tekstur AI...</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default DesignCanvas;
