
import React from 'react';
import { GarmentSpec } from '../types';

interface DesignSpecsProps {
  specs: GarmentSpec;
}

const DesignSpecs: React.FC<DesignSpecsProps> = ({ specs }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fade-in">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-list-check text-indigo-500"></i>
        Spesifikasi Produksi
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Material</p>
          <p className="text-sm font-semibold text-slate-800">{specs.material}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Gramasi</p>
          <p className="text-sm font-semibold text-slate-800">{specs.weight}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Jahitan</p>
          <p className="text-sm font-semibold text-slate-800">{specs.stitchType}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-indigo-100 bg-indigo-50">
          <p className="text-xs text-indigo-600 uppercase font-bold tracking-wider mb-1">Estimasi Harga</p>
          <p className="text-sm font-bold text-indigo-700">{specs.estimatedPrice}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Size Chart (cm)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 font-bold text-slate-600">Size</th>
                <th className="px-3 py-2 font-bold text-slate-600">Lebar</th>
                <th className="px-3 py-2 font-bold text-slate-600">Panjang</th>
              </tr>
            </thead>
            <tbody>
              {specs.sizingChart.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold">{item.size}</td>
                  <td className="px-3 py-2">{item.width}</td>
                  <td className="px-3 py-2">{item.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-indigo-600 text-white rounded-xl text-center cursor-pointer hover:bg-indigo-700 transition-colors">
        <button className="font-bold">Pesan Sekarang</button>
      </div>
    </div>
  );
};

export default DesignSpecs;
