
export type GarmentType = 'T-Shirt' | 'Hoodie' | 'Polo' | 'Seragam' | 'Jaket';
export type ImageSize = '1K' | '2K' | '4K';
export type AppView = 'landing' | 'editor' | 'bg-studio';

export interface PrintArea {
  x: number;      // 0-1000
  y: number;      // 0-1000
  width: number;  // 0-1000
  height: number; // 0-1000
}

export interface DefaultMockup {
  id: string;
  name: string;
  url: string;
  color: 'Hitam' | 'Putih';
  sleeve: 'Pendek' | 'Panjang';
  printArea?: PrintArea; // Area cetak spesifik untuk mockup ini
}

export interface GarmentSpec {
  material: string;
  weight: string;
  stitchType: string;
  estimatedPrice: string;
  description: string;
  sizingChart: {
    size: string;
    width: number;
    length: number;
  }[];
}

export interface DesignState {
  type: GarmentType;
  color: string;
  prompt: string;
  specs: GarmentSpec | null;
  mockupUrl: string;
  designUrl: string | null;
  isGenerating: boolean;
  isUserUploaded: boolean;
  imageSize: ImageSize;
  // Transform properties
  rotation: number;   // Derajat (0-360)
  opacity: number;    // 0-1
  flipX: boolean;     // Flip horizontal
  scale: number;      // Ukuran 0-1
  pos: { x: number, y: number }; // Posisi relatif 0-1
}
