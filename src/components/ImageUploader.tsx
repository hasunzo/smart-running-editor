import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  title: string;
  description: string;
  onImageUpload: (file: File) => void;
  uploadedImage?: string;
}

export function ImageUploader({ title, description, onImageUpload, uploadedImage }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputId = `file-${title.replace(/\s+/g, '-')}`;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onImageUpload(files[0]);
    }
  };

  const getIcon = () => {
    if (title.includes('배경')) {
      return <ImageIcon className="w-5 h-5" />;
    } else if (title.includes('기록')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <ImageIcon className="w-5 h-5" />;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">{description}</p>
          
          {uploadedImage ? (
            <div className="relative group">
              <img 
                src={uploadedImage} 
                alt="업로드된 이미지" 
                className="w-full h-32 object-cover rounded-lg border shadow-sm"
              />
              
              {/* 성공 표시 */}
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              
              {/* 호버 시 변경 버튼 */}
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => document.getElementById(fileInputId)?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  변경
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className={`border-2 border-border rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-border hover:border-primary hover:bg-primary/5'
              }`}
              onClick={() => document.getElementById(fileInputId)?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className={`w-8 h-8 transition-colors ${
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    클릭하여 이미지 업로드
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}