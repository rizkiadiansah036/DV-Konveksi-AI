
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
  onStartBackgroundStudio: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onStartBackgroundStudio, onToggleTheme, theme }) => {
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Floating Theme Toggle */}
      <div className="fixed top-8 right-8 z-[100]">
        <button 
          onClick={onToggleTheme}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full">
        
        {/* Branding & Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl mx-auto mb-6 transition-all ${theme === 'dark' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-red-600 shadow-red-500/20'}`}>
            <i className="fas fa-cube text-2xl"></i>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            DV Konveksi <span className={theme === 'dark' ? 'text-indigo-500' : 'text-red-600'}>AI</span>
          </h1>
          <p className="text-sm md:text-lg font-medium text-slate-500 max-w-md mx-auto leading-relaxed uppercase tracking-widest">
            Asisten Pintar untuk Produksi Konveksi Modern & Realistis
          </p>
        </div>

        {/* Short Features List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {[
            { icon: 'fa-wand-magic-sparkles', title: 'AI Blend', desc: 'Desain menyatu otomatis dengan serat kain.' },
            { icon: 'fa-images', title: 'AI Studio', desc: 'Generate background iklan profesional dalam sekejap.' },
            { icon: 'fa-shield-check', title: 'Pro Quality', desc: 'Hasil tajam siap untuk proses produksi.' }
          ].map((feature, i) => (
            <div key={i} className={`p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500' : 'bg-white border-slate-100 shadow-sm hover:border-red-500'}`}>
              <i className={`fas ${feature.icon} mb-3 text-lg ${theme === 'dark' ? 'text-indigo-400' : 'text-red-600'}`}></i>
              <h3 className="text-xs font-black uppercase tracking-widest mb-1">{feature.title}</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-700">
          <button 
            onClick={onStart}
            className={`group relative w-full max-w-sm py-6 rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25'}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-4">
              Mulai Desain Mockup <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
            </span>
            <div className={`absolute inset-0 rounded-[2rem] animate-ping opacity-20 ${theme === 'dark' ? 'bg-indigo-400' : 'bg-red-400'}`}></div>
          </button>

          <button 
            onClick={onStartBackgroundStudio}
            className={`w-full max-w-sm py-5 rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] border-2 transition-all flex items-center justify-center gap-4 active:scale-95 ${theme === 'dark' ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/20' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <i className="fas fa-magic"></i> Generate Background Produk
          </button>

          <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Tanpa Login • 2025 AI Technology
          </p>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="p-8 text-center border-t border-slate-100 dark:border-slate-900">
        <p className={`text-[8px] font-black uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>
          © 2025 DV Konveksi Assistant AI
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
