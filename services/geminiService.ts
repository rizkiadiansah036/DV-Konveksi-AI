
import { GoogleGenAI, Type } from "@google/genai";
import { INITIAL_SPEC_PROMPT } from "../constants";
import { GarmentSpec, ImageSize } from "../types";

const fetchImageAsBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
  if (url.startsWith('data:')) {
    const [header, data] = url.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return { base64: data, mimeType };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Context failed"));
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/png' });
    };
    img.onerror = () => reject(new Error("CORS/Connection error"));
    img.src = url;
  });
};

const makeTransparent = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(`data:image/png;base64,${base64}`);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) data[i+3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = `data:image/png;base64,${base64}`;
  });
};

export const generateMockup = async (type: string, color: string, prompt: string, size: ImageSize = '1K'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePrompt = `High quality product photography of a ${color} ${type} with desain: ${prompt}. Professional apparel mockup. NO HUMANS.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: imagePrompt }] },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: size } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed");
};

export const removeDesignBackground = async (base64Data: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { base64, mimeType } = await fetchImageAsBase64(base64Data);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: "STRICT: Remove background. Output desain on PURE WHITE #FFFFFF background. Clean edges." },
      ],
    },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  let resB64 = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) { resB64 = part.inlineData.data; break; }
  }
  return await makeTransparent(resB64);
};

export const refineRealisticDesign = async (compositeBase64: string, aspectRatio: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { base64, mimeType } = await fetchImageAsBase64(compositeBase64);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: "STRICT FABRIC BLEND: Precisely integrate the graphic onto the fabric textile. The graphic must follow wrinkles, shadows, and textile highlights perfectly. DO NOT change the garment color, garment shape, or background. Only affect the graphic layer to make it look printed on the shirt. The output must have exactly the same garment and background as the input image." },
      ],
    },
    config: { imageConfig: { aspectRatio } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed");
};

export const generateProductBackground = async (productBase64: string, iterationHint: string = ""): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { base64, mimeType } = await fetchImageAsBase64(productBase64);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: `DEEP PRODUCT ANALYSIS & ADVERTISING BACKGROUND GENERATION: 
        1. FIRST, analyze the product in the image: what is the item category (t-shirt, hoodie, accessory?), what is the material texture (cotton, leather, metal?), what is the current lighting direction, and what is the core color palette?
        2. SECOND, based on that analysis, create a contextual high-end commercial background for a ${iterationHint} mood.
        3. The new background MUST match the product's perspective, scale, and lighting direction perfectly.
        4. Preserve 100% of the product's original appearance. Do not alter its shape or color.
        5. Place the product naturally in the scene with realistic contact shadows and depth of field.
        6. The final result should look like a professional brand catalog photo where the product belongs to the environment.` },
      ],
    },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to generate background");
};

export const enhanceFinalImage = async (compositeBase64: string, aspectRatio: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { base64, mimeType } = await fetchImageAsBase64(compositeBase64);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: "ULTRA HD ENHANCEMENT: Sharpen fabric textures and desain edges. Professional studio 4K quality." },
      ],
    },
    config: { imageConfig: { aspectRatio } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed");
};

export const changeMockupBackground = async (imageUrl: string, mimeType: string, colorName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { base64, mimeType: actualMime } = await fetchImageAsBase64(imageUrl);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: actualMime } },
        { text: `Replace background outside the garment with SOLID FLAT ${colorName} color. Keep garment original.` },
      ],
    },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed");
};

export const processUploadedMockup = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { base64, mimeType: actualMime } = await fetchImageAsBase64(base64Data);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: actualMime } },
        { text: "Enhance product photo on studio background. 1:1." },
      ],
    },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed");
};
