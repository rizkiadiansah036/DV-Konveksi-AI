
import React from 'react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onGoHome }) => {
  return (
    <header className={`sticky top-0 z-[70] border-b px-6 py-4 transition-all duration-500 ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-lg`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button 
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
          title="Kembali ke Beranda"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xl transition-all ${theme === 'dark' ? 'bg-indigo-600 shadow-indigo-900/20 group-hover:bg-indigo-500' : 'bg-red-600 shadow-red-200 group-hover:bg-red-700'}`}>
            <i className="fas fa-cube text-sm"></i>
          </div>
          <div>
            <h1 className={`text-sm font-black leading-none tracking-tight uppercase transition-colors ${theme === 'dark' ? 'text-white group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-red-600'}`}>DV Konveksi AI</h1>
            <p className={`text-[8px] font-black tracking-[0.2em] uppercase mt-1 transition-colors ${theme === 'dark' ? 'text-indigo-400' : 'text-red-600'}`}>smart assistant ai</p>
          </div>
        </button>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleTheme}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title={theme === 'dark' ? 'Mode Terang (Merah-Putih)' : 'Mode Gelap'}
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
          </button>
          <div className="hidden md:flex">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v2.1 Pro</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
