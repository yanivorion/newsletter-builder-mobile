import React, { useRef, useState } from 'react';
import { Upload, RefreshCw, X, Sparkles, Loader2, Link, Image } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

function ImageUploader({ currentImage, onImageUpload, onImageUrl, onRemoveBackground, isProcessing, compact = false, showUrlOption = true }) {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('upload'); // 'upload' or 'url'
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onImageUpload(null);
    setUrlInput('');
    setUrlError('');
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    
    // Basic URL validation
    if (!urlInput.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) && 
        !urlInput.match(/^https?:\/\/.+/i)) {
      setUrlError('Please enter a valid image URL');
      return;
    }

    setUrlError('');
    // Pass URL directly - onImageUrl or onImageUpload with string
    if (onImageUrl) {
      onImageUrl(urlInput.trim());
    } else {
      // If no onImageUrl handler, pass URL as the image value directly
      onImageUpload(urlInput.trim());
    }
    setUrlInput('');
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.match(/^https?:\/\/.+/i)) {
      setUrlInput(pastedText);
      // Auto-submit on paste if it looks like a valid URL
      setTimeout(() => {
        if (onImageUrl) {
          onImageUrl(pastedText.trim());
        } else {
          onImageUpload(pastedText.trim());
        }
        setUrlInput('');
      }, 100);
    }
  };

  // Check if current image is a URL (not base64)
  const isUrlImage = currentImage && currentImage.startsWith('http');

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentImage ? (
        <div className="space-y-2">
          <div className={cn(
            "relative rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200",
            compact ? "h-20" : "h-28"
          )}>
            <img 
              src={currentImage} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
            {/* URL indicator */}
            {isUrlImage && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded">
                URL
              </div>
            )}
          </div>
          
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={isProcessing}
              className="flex-1 h-7 text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              Change
            </Button>
            {onRemoveBackground && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveBackground}
                disabled={isProcessing}
                className="flex-1 h-7 text-[10px]"
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                BG
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isProcessing}
              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mode Toggle */}
          {showUrlOption && (
            <div className="flex gap-1 p-0.5 bg-zinc-100 rounded-lg">
              <button
                onClick={() => setMode('upload')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded text-[10px] font-medium transition-all",
                  mode === 'upload' 
                    ? "bg-white text-zinc-900 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Image className="w-3 h-3" />
                Upload
              </button>
              <button
                onClick={() => setMode('url')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded text-[10px] font-medium transition-all",
                  mode === 'url' 
                    ? "bg-white text-zinc-900 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Link className="w-3 h-3" />
                URL
              </button>
            </div>
          )}

          {mode === 'upload' ? (
            <button
              onClick={handleClick}
              className={cn(
                "w-full rounded-xl border-2 border-dashed border-zinc-200 hover:border-[#04D1FC] bg-zinc-50 hover:bg-[#04D1FC]/5",
                "transition-all duration-200 flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-[#04D1FC]",
                compact ? "h-20" : "h-24"
              )}
            >
              <Upload className="w-5 h-5" />
              <span className="text-[10px] font-medium">Click to upload</span>
            </button>
          ) : (
            <div className="space-y-1.5">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError('');
                }}
                onPaste={handlePaste}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="Paste image URL..."
                className={cn(
                  "w-full px-3 py-2 text-xs rounded-lg border bg-white",
                  "focus:outline-none focus:ring-2 focus:ring-[#04D1FC]/20 focus:border-[#04D1FC]",
                  urlError ? "border-red-300" : "border-zinc-200"
                )}
              />
              {urlError && (
                <p className="text-[9px] text-red-500">{urlError}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="w-full h-7 text-[10px]"
              >
                <Link className="w-3 h-3" />
                Use URL
              </Button>
              <p className="text-[9px] text-zinc-400 text-center">
                Tip: URLs keep HTML small!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
