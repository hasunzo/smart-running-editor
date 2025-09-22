import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Type } from 'lucide-react';

interface ColorSelectorProps {
  selectedColor: 'white' | 'black';
  onColorChange: (color: 'white' | 'black') => void;
}

export function ColorSelector({ selectedColor, onColorChange }: ColorSelectorProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          텍스트 색상
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            러닝 기록 텍스트의 색상을 선택하세요
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedColor === 'white' ? 'default' : 'outline'}
              className="h-12 border-2 transition-all duration-200"
              onClick={() => onColorChange('white')}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-full"></div>
                <span className="text-sm font-medium">화이트</span>
              </div>
            </Button>
            
            <Button
              variant={selectedColor === 'black' ? 'default' : 'outline'}
              className="h-12 border-2 transition-all duration-200"
              onClick={() => onColorChange('black')}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded-full"></div>
                <span className="text-sm font-medium">블랙</span>
              </div>
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            {selectedColor === 'white' 
              ? '어두운 배경에 잘 보이는 흰색 텍스트' 
              : '밝은 배경에 잘 보이는 검은색 텍스트'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}