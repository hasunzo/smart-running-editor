import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Edit3, Download, RotateCcw } from 'lucide-react';

interface ImageEditorProps {
  backgroundImage: string;
  runningRecordImage: string;
  textColor: 'white' | 'black';
  onSave: (imageDataUrl: string) => void;
}

export function ImageEditor({ backgroundImage, runningRecordImage, textColor, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedStatsImage, setProcessedStatsImage] = useState<any>(null);
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    initializeFabricCanvas();
  }, []);

  useEffect(() => {
    if (backgroundImage && runningRecordImage) {
      processAndComposite();
    }
  }, [backgroundImage, runningRecordImage, textColor]);

  const initializeFabricCanvas = async () => {
    // Fabric.js 로드 대기
    while (typeof (window as any).fabric === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const { fabric } = window as any;
    
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
      width: 300,
      height: 450,
      backgroundColor: '#f3f4f6'
    });
  };

  // 스마트 크롭핑 알고리즘
  const smartCropRunningStats = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let textPixels: Array<{x: number, y: number}> = [];
    
    // 텍스트/숫자 픽셀 감지 (비교적 어두운 픽셀 + 색상 대비 고려)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        
        // 더 넓은 범위의 텍스트 감지 (어두운 그리 + 색상 있는 텍스트)
        if (brightness < 160 || (Math.abs(r-g) > 30 || Math.abs(g-b) > 30 || Math.abs(r-b) > 30)) {
          textPixels.push({x, y});
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // 상단 40%와 하단 30% 영역의 텍스트를 모두 우선 포함
    const topRegion = height * 0.4;
    const bottomRegion = height * 0.7;
    const importantPixels = textPixels.filter(p => p.y < topRegion || p.y > bottomRegion);
    
    if (importantPixels.length > 0) {
      const impMinY = Math.min(...importantPixels.map(p => p.y));
      const impMaxY = Math.max(...importantPixels.map(p => p.y));
      minY = Math.min(minY, impMinY);
      maxY = Math.max(maxY, impMaxY);
    }
    
    // 적절한 여백 추가 (상하좌우 다른 마진)
    const horizontalMargin = Math.min(width, height) * 0.1;
    const verticalMargin = Math.min(width, height) * 0.15; // 세로 마진 증가
    minX = Math.max(0, minX - horizontalMargin);
    maxX = Math.min(width, maxX + horizontalMargin);
    minY = Math.max(0, minY - verticalMargin);
    maxY = Math.min(height, maxY + verticalMargin * 1.5); // 하단 마진 더 크게
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  // 고급 배경 제거 알고리즘
  const advancedRemoveBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, colorMode: string) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 가장자리 픽셀로 배경색 자동 감지
    let bgR = 0, bgG = 0, bgB = 0;
    let edgePixelCount = 0;
    
    // 가장자리 20픽셀 샘플링
    const edgeSize = 20;
    for (let i = 0; i < edgeSize && i < width; i++) {
      for (let j = 0; j < edgeSize && j < height; j++) {
        const positions = [
          j * width + i,  // 왼쪽 위
          j * width + (width - 1 - i),  // 오른쪽 위
          (height - 1 - j) * width + i,  // 왼쪽 아래
          (height - 1 - j) * width + (width - 1 - i)  // 오른쪽 아래
        ];
        
        positions.forEach(pos => {
          if (pos * 4 < data.length) {
            bgR += data[pos * 4];
            bgG += data[pos * 4 + 1];
            bgB += data[pos * 4 + 2];
            edgePixelCount++;
          }
        });
      }
    }
    
    bgR /= edgePixelCount;
    bgG /= edgePixelCount;
    bgB /= edgePixelCount;
    
    // 임계값 기반 배경/텍스트 구분
    const threshold = 40;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 유클리드 거리로 배경 판단
      const distance = Math.sqrt(
        Math.pow(r - bgR, 2) + 
        Math.pow(g - bgG, 2) + 
        Math.pow(b - bgB, 2)
      );
      
      if (distance < threshold) {
        // 배경으로 판단 - 투명화
        data[i + 3] = 0;
      } else {
        // 텍스트로 판단 - 색상 모드 적용
        if (colorMode === 'white') {
          data[i] = 255;      // R
          data[i + 1] = 255;  // G
          data[i + 2] = 255;  // B
          data[i + 3] = 255;  // A
        } else {
          // 원본 색상 유지하면서 대비 강화
          if (r + g + b < 300) {  // 어두운 색상인 경우
            data[i] = Math.max(0, r - 20);
            data[i + 1] = Math.max(0, g - 20);
            data[i + 2] = Math.max(0, b - 20);
          }
          data[i + 3] = 255;
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const processStatsImage = async (statsImg: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = statsImg.width;
    canvas.height = statsImg.height;
    ctx.drawImage(statsImg, 0, 0);
    
    // 자동 크롭핑 적용
    const cropArea = smartCropRunningStats(ctx, canvas.width, canvas.height);
    
    // 크롭된 영역만 추출
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d')!;
    
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    
    croppedCtx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );
    
    // 배경 제거 및 색상 변경
    advancedRemoveBackground(croppedCtx, croppedCanvas.width, croppedCanvas.height, textColor);
    
    // Fabric.js Image 객체로 변환
    return new Promise((resolve) => {
      const { fabric } = window as any;
      fabric.Image.fromURL(croppedCanvas.toDataURL(), (img: any) => {
        resolve(img);
      });
    });
  };

  const processAndComposite = async () => {
    if (!fabricCanvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // 배경 이미지 로드
      const bgImg = await loadImage(backgroundImage);
      setBackgroundImg(bgImg);
      
      // 러닝 기록 이미지 처리
      const statsImg = await loadImage(runningRecordImage);
      const processedStats = await processStatsImage(statsImg);
      
      // 캔버스 크기를 배경 이미지 비율에 맞게 설정 (전체 이미지가 보이도록)
      const maxWidth = 300;
      const maxHeight = 450;
      
      const bgAspectRatio = bgImg.width / bgImg.height;
      const containerAspectRatio = maxWidth / maxHeight;
      
      let canvasWidth, canvasHeight;
      
      if (bgAspectRatio > containerAspectRatio) {
        // 배경이 더 넓은 경우
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / bgAspectRatio;
      } else {
        // 배경이 더 높은 경우
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * bgAspectRatio;
      }
      
      fabricCanvasRef.current.setDimensions({
        width: canvasWidth,
        height: canvasHeight
      });
      
      // 기존 객체 제거
      fabricCanvasRef.current.clear();
      
      // 배경 이미지 추가 (전체가 보이도록)
      const { fabric } = window as any;
      const fabricBgImg = await new Promise((resolve) => {
        fabric.Image.fromURL(backgroundImage, (img: any) => {
          img.set({
            left: 0,
            top: 0,
            scaleX: canvasWidth / bgImg.width,
            scaleY: canvasHeight / bgImg.height,
            selectable: false
          });
          resolve(img);
        });
      });
      
      fabricCanvasRef.current.add(fabricBgImg);
      
      // 러닝 기록 이미지 추가
      const maxStatsWidth = canvasWidth * 0.25;
      const scale = Math.min(maxStatsWidth / (processedStats as any).width, 0.8);
      
      (processedStats as any).set({
        left: canvasWidth * 0.05,
        top: canvasHeight * 0.05,
        scaleX: scale,
        scaleY: scale,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.3)',
          blur: 10,
          offsetX: 3,
          offsetY: 3
        })
      });
      
      fabricCanvasRef.current.add(processedStats);
      fabricCanvasRef.current.setActiveObject(processedStats);
      fabricCanvasRef.current.renderAll();
      
      setProcessedStatsImage(processedStats);
      
    } catch (error) {
      console.error('이미지 처리 중 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPosition = () => {
    if (processedStatsImage && fabricCanvasRef.current) {
      processedStatsImage.set({
        left: fabricCanvasRef.current.width * 0.05,
        top: fabricCanvasRef.current.height * 0.05
      });
      fabricCanvasRef.current.renderAll();
    }
  };

  const saveImage = () => {
    if (!fabricCanvasRef.current || !backgroundImg) return;
    
    // 선택 상태 해제
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
    
    // 원본 배경 이미지 크기로 고품질 저장
    const originalWidth = backgroundImg.width;
    const originalHeight = backgroundImg.height;
    
    // 고품질 다운로드를 위한 임시 캔버스 (원본 크기)
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d')!;
    
    downloadCanvas.width = originalWidth;
    downloadCanvas.height = originalHeight;
    
    // 먼저 원본 배경 이미지를 그리기
    downloadCtx.drawImage(backgroundImg, 0, 0, originalWidth, originalHeight);
    
    // 러닝 기록 이미지가 있으면 합성
    if (processedStatsImage) {
      // 현재 캔버스에서의 러닝 기록 위치와 크기 가져오기
      const statsLeft = processedStatsImage.left;
      const statsTop = processedStatsImage.top;
      const statsScaleX = processedStatsImage.scaleX;
      const statsScaleY = processedStatsImage.scaleY;
      const statsWidth = processedStatsImage.width * statsScaleX;
      const statsHeight = processedStatsImage.height * statsScaleY;
      
      // 현재 캔버스 크기 대비 원본 크기 비율 계산
      const canvasToOriginalScaleX = originalWidth / fabricCanvasRef.current.width;
      const canvasToOriginalScaleY = originalHeight / fabricCanvasRef.current.height;
      
      // 원본 크기 기준으로 위치와 크기 계산
      const finalLeft = statsLeft * canvasToOriginalScaleX;
      const finalTop = statsTop * canvasToOriginalScaleY;
      const finalWidth = statsWidth * canvasToOriginalScaleX;
      const finalHeight = statsHeight * canvasToOriginalScaleY;
      
      // 러닝 기록 이미지를 임시 캔버스에 그리기
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = processedStatsImage.width;
      tempCanvas.height = processedStatsImage.height;
      
      // processedStatsImage의 실제 이미지 데이터 가져오기
      const imgElement = processedStatsImage.getElement();
      tempCtx.drawImage(imgElement, 0, 0);
      
      // 그림자 효과 적용
      downloadCtx.save();
      downloadCtx.shadowColor = 'rgba(0,0,0,0.3)';
      downloadCtx.shadowBlur = 15 * (originalWidth / 300); // 원본 크기에 맞게 조정
      downloadCtx.shadowOffsetX = 5 * (originalWidth / 300);
      downloadCtx.shadowOffsetY = 5 * (originalHeight / 450);
      
      // 최종 합성
      downloadCtx.drawImage(tempCanvas, finalLeft, finalTop, finalWidth, finalHeight);
      downloadCtx.restore();
    }
    
    const dataUrl = downloadCanvas.toDataURL('image/png', 1.0);
    onSave(dataUrl);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          이미지 편집
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            러닝 기록을 드래그하여 위치를 조정하세요
          </p>
          
          {isProcessing && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">이미지 처리 중...</span>
            </div>
          )}
          
          <div className="relative bg-gray-50 rounded-lg p-4 flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border rounded-lg shadow-sm"
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={resetPosition}
              disabled={!processedStatsImage}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              위치 초기화
            </Button>
            
            <Button
              size="sm"
              className="flex-1"
              onClick={saveImage}
              disabled={!processedStatsImage}
            >
              <Download className="w-4 h-4 mr-1" />
              이미지 저장
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}