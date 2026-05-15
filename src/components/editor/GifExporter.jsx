import React, { useState, useRef } from 'react';
import { Download, Loader2, Film, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

function GifExporter({ targetRef, filename = 'marquee', duration = 3000, fps = 15 }) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const exportToGif = async () => {
    if (!targetRef?.current) {
      setError('No element to export');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setError(null);

    try {
      // Dynamically import the libraries
      const html2canvas = (await import('html2canvas')).default;
      const GIF = (await import('gif.js')).default;

      const element = targetRef.current;
      const rect = element.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const scale = 2;

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: width * scale,
        height: height * scale,
        workerScript: '/gif.worker.js'
      });

      const totalFrames = Math.floor((duration / 1000) * fps);
      const frameDelay = 1000 / fps;

      // Capture frames at 2x for quality
      for (let i = 0; i < totalFrames; i++) {
        const canvas = await html2canvas(element, {
          width,
          height,
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        });

        gif.addFrame(canvas, { delay: frameDelay, copy: true });
        setProgress(Math.round((i / totalFrames) * 80));

        // Wait for animation to progress
        await new Promise(resolve => setTimeout(resolve, frameDelay));
      }

      // Render GIF
      gif.on('progress', (p) => {
        setProgress(80 + Math.round(p * 20));
      });

      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setIsExporting(false);
        setProgress(100);
      });

      gif.render();
    } catch (err) {
      console.error('GIF export error:', err);
      setError('Failed to export GIF. Try using a screen recording tool instead.');
      setIsExporting(false);
    }
  };

  const downloadGif = () => {
    if (!previewUrl) return;
    
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${filename}-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setProgress(0);
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToGif}
        disabled={isExporting}
        className="w-full"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting... {progress}%
          </>
        ) : (
          <>
            <Film className="w-4 h-4" />
            Export as GIF
          </>
        )}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
          <p className="text-[10px] text-red-500 mt-1">
            Alternative: Use ScreenToGif or your OS screen recorder to capture the animation.
          </p>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">GIF Preview</h3>
              <Button variant="ghost" size="sm" onClick={closePreview}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <img 
                src={previewUrl} 
                alt="GIF Preview" 
                className="w-full rounded-lg border border-zinc-200"
              />
            </div>
            <div className="p-4 border-t border-zinc-100 flex gap-2">
              <Button onClick={downloadGif} className="flex-1">
                <Download className="w-4 h-4" />
                Download GIF
              </Button>
              <Button variant="outline" onClick={closePreview}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GifExporter;

