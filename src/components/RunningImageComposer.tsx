import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { ColorSelector } from './ColorSelector';
import { ImageEditor } from './ImageEditor';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Wand2, CheckCircle } from 'lucide-react';

type Step = 'upload' | 'editing' | 'completed';

export function RunningImageComposer() {
  const [step, setStep] = useState<Step>('upload');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [runningRecordImage, setRunningRecordImage] = useState<string>('');
  const [textColor, setTextColor] = useState<'white' | 'black'>('white');
  const [savedImageUrl, setSavedImageUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Fabric.js 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 간단한 상태 메시지 표시 (토스트 대신)
  const showStatus = (message: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 1500); // 1.5초 후 자동 제거
  };

  const handleBackgroundUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundImage(e.target?.result as string);
      // 토스트 대신 간단한 시각적 피드백만
    };
    reader.readAsDataURL(file);
  };

  const handleRecordUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setRunningRecordImage(e.target?.result as string);
      // 토스트 대신 간단한 시각적 피드백만
    };
    reader.readAsDataURL(file);
  };

  const generateImage = () => {
    if (!backgroundImage || !runningRecordImage) {
      showStatus('이미지를 모두 업로드해주세요', 'error');
      return;
    }
    
    setStep('editing');
  };

  const handleSave = (imageDataUrl: string) => {
    setSavedImageUrl(imageDataUrl);
    setStep('completed');
    
    // 이미지 다운로드
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    link.download = `스마트_러닝_인증샷_${timestamp}.png`;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startOver = () => {
    setStep('upload');
    setBackgroundImage('');
    setRunningRecordImage('');
    setTextColor('white');
    setSavedImageUrl('');
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', label: '업로드', number: 1 },
      { id: 'editing', label: '편집', number: 2 },
      { id: 'completed', label: '완료', number: 3 }
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-6">
        {steps.map((stepItem, index) => {
          const isActive = step === stepItem.id;
          const isCompleted = steps.findIndex(s => s.id === step) > index;

          return (
            <React.Fragment key={stepItem.id}>
              <div className={`flex items-center space-x-2 ${
                isActive ? 'text-primary' : 
                isCompleted ? 'text-green-600' : 
                'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${
                  isActive ? 'border-primary bg-primary text-white' : 
                  isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                  'border-muted-foreground'
                }`}>
                  {stepItem.number}
                </div>
                <span className="font-medium">{stepItem.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px ${
                  isCompleted ? 'bg-green-600' : 'bg-muted-foreground'
                }`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">러닝 인증샷 합성기</h1>
          <p className="text-muted-foreground">
            배경사진과 러닝기록을 자연스럽게 합성해보세요
          </p>
        </div>

        {/* 상태 메시지 (상단 고정, 짧은 표시) */}
        {statusMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
              {statusMessage}
            </div>
          </div>
        )}

        {/* 단계 표시 */}
        {renderStepIndicator()}

        {/* 업로드 단계 */}
        {step === 'upload' && (
          <div className="space-y-4">
            <ImageUploader
              title="배경 러닝 사진"
              description="러닝하는 모습이 담긴 배경 사진을 업로드하세요"
              onImageUpload={handleBackgroundUpload}
              uploadedImage={backgroundImage}
            />
            
            <ImageUploader
              title="러닝 기록 스크린샷"
              description="러닝 앱의 기록 화면을 캡처해서 업로드하세요"
              onImageUpload={handleRecordUpload}
              uploadedImage={runningRecordImage}
            />
            
            <ColorSelector
              selectedColor={textColor}
              onColorChange={setTextColor}
            />
            
            <Button
              className="w-full h-12"
              onClick={generateImage}
              disabled={!backgroundImage || !runningRecordImage}
            >
              <Wand2 className="w-5 h-5 mr-2" />
              이미지 생성하기
            </Button>
          </div>
        )}

        {/* 편집 단계 */}
        {step === 'editing' && (
          <div className="space-y-4">
            <ImageEditor
              backgroundImage={backgroundImage}
              runningRecordImage={runningRecordImage}
              textColor={textColor}
              onSave={handleSave}
            />
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep('upload')}
            >
              뒤로 가기
            </Button>
          </div>
        )}

        {/* 완료 단계 */}
        {step === 'completed' && (
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                합성 완료!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  러닝 인증샷이 성공적으로 생성되었습니다.
                </p>
                {savedImageUrl && (
                  <img 
                    src={savedImageUrl} 
                    alt="완성된 러닝 인증샷" 
                    className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                  />
                )}
              </div>
              
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={startOver}
                >
                  새로운 이미지 만들기
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('editing')}
                >
                  다시 편집하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}