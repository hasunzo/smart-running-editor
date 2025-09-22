// 스마트 크롭핑 알고리즘
export const smartCropRunningStats = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let textPixels: Array<{x: number, y: number}> = [];
  
  // 텍스트/숫자 픽셀 감지 (brightness < 120)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness < 120) {
        textPixels.push({x, y});
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // 상단 40% 영역의 큰 숫자들 우선 포함
  const topRegion = height * 0.4;
  const importantPixels = textPixels.filter(p => p.y < topRegion);
  
  if (importantPixels.length > 0) {
    const impMinY = Math.min(...importantPixels.map(p => p.y));
    minY = Math.min(minY, impMinY);
  }
  
  // 적절한 여백 추가 (10% 마진)
  const margin = Math.min(width, height) * 0.1;
  minX = Math.max(0, minX - margin);
  maxX = Math.min(width, maxX + margin);
  minY = Math.max(0, minY - margin);
  maxY = Math.min(height, maxY + margin);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

// 고급 배경 제거 알고리즘
export const advancedRemoveBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, colorMode: string) => {
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

// 이미지 로드 헬퍼
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// 파일명 생성 헬퍼
export const generateFileName = (prefix: string = '스마트_러닝_인증샷') => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
  return `${prefix}_${timestamp}.png`;
};