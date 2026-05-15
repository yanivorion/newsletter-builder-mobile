/**
 * Flatten PNG transparency onto a solid color and return a PNG data URL.
 */
export function flattenImageTransparency(imageUrl, bgColor = '#FFFFFF') {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      } catch {
        resolve({ dataUrl: imageUrl, width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = () => resolve({ dataUrl: imageUrl, width: 0, height: 0 });
    img.src = imageUrl;
  });
}
