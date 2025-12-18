
import React, { useState } from 'react';
import { DEFAULT_MOCKUPS, MOCKUP_BG_COLORS } from '../constants';
import { processUploadedMockup, changeMockupBackground } from '../services/geminiService';

interface MockupSelectorProps {
  selectedUrl: string;
  theme: 'light' | 'dark';
  onSelect: (url: string, isUserUploaded: boolean) => void;
}

interface MockupItem {
  id: string;
  url: string;
  name: string;
  isUserUploaded: boolean;
  isVariation?: boolean;
}

const MockupSelector: React.FC<MockupSelectorProps> = ({ selectedUrl, theme, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMockups, setUserMockups] = useState<MockupItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setError(null);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target?.result) {
          const rawUrl = e.target.result as string;
          try {
            const processedUrl = await processUploadedMockup(rawUrl, file.type);
            const newId = `user-${Date.now()}`;
            const newItem: MockupItem = { id: newId, url: processedUrl, name: 'Upload Baru', isUserUploaded: true };
            setUserMockups(prev => [newItem, ...prev]);
            onSelect(processedUrl, true);
          } catch (err: any) {
            console.error(err);
            const newId = `user-${Date.now()}`;
            const newItem: MockupItem = { id: newId, url: rawUrl, name: 'Upload Baru', isUserUploaded: true };
            setUserMockups(prev => [newItem, ...prev]);
            onSelect(rawUrl, true);
          } finally {
            setIsProcessing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleCreateVariation = async (e: React.MouseEvent, sourceMockup: { url: string, name: string }, colorName: string) => {
    e.stopPropagation();
    setError(null);
    setEditingId(`${sourceMockup.url}-${colorName}`);
    try {
      const newUrl = await changeMockupBackground(sourceMockup.url, "image/png", colorName);
      const newId = `var-${Date.now()}`;
      const newItem: MockupItem = { 
        id: newId, 
        url: newUrl, 
        name: `${sourceMockup.name} (${colorName})`, 
        isUserUploaded: true,
        isVariation: true
      };
      setUserMockups(prev => [newItem, ...prev]);
      onSelect(newUrl, true);
    } catch (err: any) {
      setError(`Gagal: AI sedang sibuk.`);
    } finally {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center group cursor-pointer py-2 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-2">
          <label className={`text-[11px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-slate-300 group-hover:text-indigo-400' : 'text-slate-700 group-hover:text-red-600'}`}>
            PILIH DASAR MOCKUP
          </label>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <i className={`fas fa-chevron-down ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}></i>
        </div>
      </button>

      {error && (
        <div className="p-2 bg-red-50 text-red-600 text-[9px] font-bold rounded-lg border border-red-100 flex items-center gap-2 animate-shake">
          <i className="fas fa-circle-exclamation"></i> {error}
        </div>
      )}
      
      <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* MOCKUPS RENDER */}
          {[...userMockups, ...DEFAULT_MOCKUPS].map((mockup) => (
            <div
              key={mockup.id}
              onClick={() => onSelect(mockup.url, mockup.id.includes('user') || mockup.id.includes('var'))}
              className={`relative group rounded-2xl overflow-hidden border-2 transition-all aspect-square bg-white cursor-pointer ${
                selectedUrl === mockup.url 
                  ? (theme === 'dark' ? 'border-indigo-600 ring-4 ring-indigo-900/20' : 'border-red-600 ring-4 ring-red-100') 
                  : (theme === 'dark' ? 'border-slate-800 hover:border-indigo-800' : 'border-slate-100 hover:border-red-200')
              }`}
            >
              <img src={mockup.url} alt={mockup.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
              {editingId?.includes(mockup.url) && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-indigo-500' : 'border-red-500'}`}></div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 bg-slate-900/60 backdrop-blur-md p-2 flex justify-center gap-1.5">
                {MOCKUP_BG_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color.name}
                    onClick={(e) => handleCreateVariation(e, mockup, color.name)}
                    className="w-4 h-4 rounded-full border border-white/30 hover:scale-125 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* UPLOAD BUTTON */}
          <label className={`relative group rounded-2xl overflow-hidden border-2 border-dashed transition-all aspect-square flex flex-col items-center justify-center cursor-pointer ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 hover:border-indigo-500' : 'border-slate-300 bg-slate-50 hover:border-red-400'}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
            {isProcessing ? (
              <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-indigo-500' : 'border-red-500'}`}></div>
            ) : (
              <>
                <i className={`fas fa-plus mb-2 text-xl ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}></i>
                <span className="text-[8px] font-black uppercase text-slate-500">Upload Baru</span>
              </>
            )}
          </label>
        </div>
      </div>

      {!isOpen && (
        <div className={`rounded-xl p-3 border transition-colors ${theme === 'dark' ? 'bg-indigo-900/10 border-indigo-800/30' : 'bg-red-50 border-red-100'}`}>
          <p className={`text-[8.5px] font-bold uppercase tracking-wider text-center leading-relaxed ${theme === 'dark' ? 'text-indigo-400' : 'text-red-600'}`}>
            <i className="fas fa-magic mr-2"></i>
            KLIK PALET WARNA DIBAWAH MOCKUP UNTUK GANTI BACKGROUND
          </p>
        </div>
      )}
    </div>
  );
};

export default MockupSelector;
