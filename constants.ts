
import { GarmentType, DefaultMockup } from './types';

export const GARMENT_TYPES: GarmentType[] = ['T-Shirt', 'Hoodie', 'Polo', 'Seragam', 'Jaket'];

export const DEFAULT_MOCKUPS: DefaultMockup[] = [
  {
    id: 'short-black',
    name: 'Kaos Hitam Polos',
    color: 'Hitam',
    sleeve: 'Pendek',
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
    printArea: { x: 320, y: 220, width: 360, height: 450 } // Area dada
  },
  {
    id: 'short-white',
    name: 'Kaos Putih Polos',
    color: 'Putih',
    sleeve: 'Pendek',
    url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000&auto=format&fit=crop',
    printArea: { x: 320, y: 220, width: 360, height: 450 }
  }
];

export const COLORS = [
  { name: 'Hitam', value: '#1a1a1a' },
  { name: 'Putih', value: '#ffffff' },
  { name: 'Navy', value: '#000080' },
  { name: 'Maroon', value: '#800000' },
  { name: 'Abu-abu', value: '#808080' },
  { name: 'Hijau Botol', value: '#006400' },
];

export const MOCKUP_BG_COLORS = [
  { name: 'Studio White', value: '#FFFFFF' },
  { name: 'Soft Gray', value: '#F3F4F6' },
  { name: 'Clean Blue', value: '#E0F2FE' },
  { name: 'Warm Sand', value: '#FEF3C7' },
  { name: 'Mint Refresh', value: '#ECFDF5' },
  { name: 'Dark Slate', value: '#1E293B' },
];

export const INITIAL_SPEC_PROMPT = (type: string, color: string, description: string) => `
Berikan spesifikasi teknis produksi konveksi untuk:
Tipe: ${type}
Warna Dominan: ${color}
Deskripsi Desain: ${description}

Format JSON:
{
  "material": "Nama bahan kain terbaik",
  "weight": "Gramasi (e.g. 24s, 30s)",
  "stitchType": "Jenis jahitan (e.g. Rantai, Overdeck)",
  "estimatedPrice": "Rentang harga produksi per pcs (IDR)",
  "description": "Ringkasan detail desain",
  "sizingChart": [
    {"size": "S", "width": 48, "length": 68},
    {"size": "M", "width": 50, "length": 70},
    {"size": "L", "width": 52, "length": 72},
    {"size": "XL", "width": 54, "length": 74}
  ]
}
`;
