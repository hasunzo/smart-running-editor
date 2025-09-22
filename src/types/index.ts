// Fabric.js 타입 정의
declare global {
  interface Window {
    fabric: any;
  }
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export type TextColorMode = 'white' | 'black';
export type ProcessingStep = 'upload' | 'editing' | 'completed';

export interface ProcessingOptions {
  textColor: TextColorMode;
  cropMode: 'auto' | 'manual' | 'full';
}

export interface ImageProcessingResult {
  processedImage: any; // Fabric.js image object
  originalDimensions: ImageDimensions;
  cropArea?: CropArea;
}