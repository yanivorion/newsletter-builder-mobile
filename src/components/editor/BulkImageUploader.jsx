import React, { useRef, useState } from 'react';
import { Upload, Images, X, Check, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

function BulkImageUploader({ maxImages, currentImages = [], onImagesChange }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsProcessing(true);

    const newImages = await Promise.all(
      imageFiles.slice(0, maxImages).map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      })
    );

    setPreviewImages(newImages);
    setIsProcessing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleApply = () => {
    // Merge preview images with current images
    const newImages = [...currentImages];
    previewImages.forEach((img, i) => {
      if (i < maxImages) {
        newImages[i] = img;
      }
    });
    onImagesChange(newImages);
    setPreviewImages([]);
  };

  const handleClear = () => {
    setPreviewImages([]);
  };

  const removePreviewImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // If we have preview images, show the preview mode
  if (previewImages.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600">
            {previewImages.length} image{previewImages.length > 1 ? 's' : ''} ready
          </span>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClear}
              className="h-7 px-2 text-xs text-zinc-500"
            >
              <X className="w-3 h-3" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleApply}
              className="h-7 px-3 text-xs bg-[#04D1FC] hover:bg-[#04D1FC]/90"
            >
              <Check className="w-3 h-3" />
              Apply
            </Button>
          </div>
        </div>

        {/* Preview Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {previewImages.map((img, index) => (
            <div 
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 group"
            >
              <img 
                src={img} 
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePreviewImage(index)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded bg-black/60 text-white text-[8px] font-bold flex items-center justify-center">
                {index + 1}
              </span>
            </div>
          ))}
          
          {/* Empty slots indicator */}
          {Array.from({ length: Math.max(0, maxImages - previewImages.length) }).map((_, i) => (
            <div 
              key={`empty-${i}`}
              className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center"
            >
              <span className="text-[10px] text-zinc-300">{previewImages.length + i + 1}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-400 text-center">
          Images will fill slots 1-{previewImages.length}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all duration-200",
          "flex flex-col items-center justify-center gap-2 text-center",
          isDragging
            ? "border-[#04D1FC] bg-[#04D1FC]/5"
            : "border-zinc-200 hover:border-[#04D1FC] hover:bg-zinc-50"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 text-[#04D1FC] animate-spin" />
            <span className="text-xs text-zinc-500">Processing...</span>
          </>
        ) : (
          <>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isDragging ? "bg-[#04D1FC]/10" : "bg-zinc-100"
            )}>
              <Images className={cn(
                "w-5 h-5 transition-colors",
                isDragging ? "text-[#04D1FC]" : "text-zinc-400"
              )} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600">
                Drop images here or click to browse
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Select up to {maxImages} images at once
              </p>
            </div>
          </>
        )}
      </div>

      {/* Current images count */}
      {currentImages.filter(Boolean).length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>{currentImages.filter(Boolean).length} of {maxImages} slots filled</span>
          <button 
            onClick={() => onImagesChange([])}
            className="text-red-500 hover:text-red-600"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default BulkImageUploader;

