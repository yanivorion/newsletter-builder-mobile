import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Copy, Check, Upload, Trash2, Loader2, FolderOpen, Palette } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { mediaKit, getLogosByCategory } from '../../lib/mediaKit';
import { useStagger } from '../../hooks/useStagger';
import { cn } from '../../lib/utils';

function MediaKitPanel({ onSelectLogo, onBulkUpload, userId }) {
  const effectiveUserId = userId || 'public';
  const [activeTab, setActiveTab] = useState('myFiles');
  const [copiedId, setCopiedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // My Files state
  const [myFiles, setMyFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);
  const myFilesInputRef = useRef(null);

  const fetchMyFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/media?userId=${effectiveUserId}`);
      const data = await res.json();
      if (data.files) setMyFiles(data.files);
    } catch {}
    setFilesLoading(false);
  }, [effectiveUserId]);

  useEffect(() => {
    if (activeTab === 'myFiles') {
      fetchMyFiles();
    }
  }, [activeTab, effectiveUserId, fetchMyFiles]);

  const handleMyFilesUpload = async (files) => {
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', effectiveUserId);
        await fetch('/api/media', { method: 'POST', body: formData });
      } catch {}
    }
    setUploading(false);
    fetchMyFiles();
  };

  const handleDeleteFile = async (filePath, fileId) => {
    setDeletingId(fileId);
    try {
      await fetch(`/api/media?path=${encodeURIComponent(filePath)}&userId=${effectiveUserId}`, {
        method: 'DELETE',
      });
      setMyFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {}
    setDeletingId(null);
  };

  const handleCopy = async (logo) => {
    await navigator.clipboard.writeText(logo.url);
    setCopiedId(logo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (logo) => {
    onSelectLogo?.(logo.url, logo);
  };

  const filteredLogos = getLogosByCategory(activeCategory);
  const logoStagger = useStagger(filteredLogos.length, { delay: 50, baseDelay: 60, distance: 10, key: activeCategory });
  const filesStagger = useStagger(myFiles.length, { delay: 40, baseDelay: 40, distance: 8, key: 'myfiles' });

  return (
    <div className="p-4 space-y-3 content-enter">
      {/* Tab switcher */}
      <div
        style={{
          display: 'flex',
          borderRadius: 10,
          background: 'rgba(0,0,0,0.04)',
          padding: 3,
          gap: 2,
        }}
      >
        <button
          onClick={() => setActiveTab('myFiles')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '6px 0',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: activeTab === 'myFiles' ? 600 : 500,
            background: activeTab === 'myFiles' ? '#fff' : 'transparent',
            color: activeTab === 'myFiles' ? 'var(--text-1, #18181b)' : 'var(--text-3, #a1a1aa)',
            boxShadow: activeTab === 'myFiles' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 200ms ease-out',
          }}
        >
          <FolderOpen size={13} />
          My Files
        </button>
        <button
          onClick={() => setActiveTab('mediaKit')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '6px 0',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: activeTab === 'mediaKit' ? 600 : 500,
            background: activeTab === 'mediaKit' ? '#fff' : 'transparent',
            color: activeTab === 'mediaKit' ? 'var(--text-1, #18181b)' : 'var(--text-3, #a1a1aa)',
            boxShadow: activeTab === 'mediaKit' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 200ms ease-out',
          }}
        >
          <Palette size={13} />
          Media Kit
        </button>
      </div>

      {/* ── MY FILES TAB ── */}
      {activeTab === 'myFiles' && (
        <div className="space-y-3">
          {/* Upload button */}
          <input
            ref={myFilesInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) handleMyFilesUpload(files);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => myFilesInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-zinc-300 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5 text-zinc-500 hover:text-[#04D1FC] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[11px] font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span className="text-[11px] font-medium">Upload to My Files</span>
              </>
            )}
          </button>

          {/* Files grid */}
          {filesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          ) : myFiles.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-[11px] text-zinc-400">
                No files yet. Upload images to build your library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {myFiles.map((file, i) => (
                <div
                  key={file.id || file.path}
                  className="media-card group relative rounded-xl border border-zinc-200/60 p-1.5 hover:border-[#04D1FC]/40 cursor-pointer bg-white overflow-hidden"
                  style={filesStagger(i)}
                  onClick={() => handleSelect({ url: file.url, name: file.name, id: file.id })}
                >
                  <div className="h-16 flex items-center justify-center rounded-lg overflow-hidden bg-zinc-50">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                      crossOrigin="anonymous"
                      style={{ transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                    />
                  </div>
                  <p className="text-[8px] text-center mt-1 truncate text-zinc-400 font-medium px-0.5">
                    {file.name?.replace(/^\d+-/, '').replace(/_/g, ' ') || 'File'}
                  </p>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.path, file.id);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-md bg-white/90 border border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-zinc-400 transition-all"
                    style={{ backdropFilter: 'blur(4px)' }}
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-2.5 h-2.5" />
                    )}
                  </button>

                  {/* Hover ring */}
                  <div
                    className="absolute inset-0 rounded-xl border-2 border-[#04D1FC] opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{ transition: 'opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-zinc-100/60">
            <p className="text-[10px] text-zinc-400 text-center">
              {myFiles.length} file{myFiles.length !== 1 ? 's' : ''} • Click to use • Shared via template links
            </p>
          </div>
        </div>
      )}

      {/* ── MEDIA KIT TAB ── */}
      {activeTab === 'mediaKit' && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Click to use, or upload to fill empty spots.
          </p>

          {/* Bulk Upload */}
          {onBulkUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) onBulkUpload(files);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-zinc-300 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5 text-zinc-500 hover:text-[#04D1FC] transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="text-[11px] font-medium">Upload images to fill spots</span>
              </button>
            </>
          )}

          {/* Category Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {mediaKit.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'pill-transition px-2.5 py-1 rounded-full text-[10px] font-medium',
                  activeCategory === cat.id
                    ? 'bg-zinc-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'bg-zinc-100/80 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-700'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Logos Grid */}
          <div className="grid grid-cols-2 gap-2">
            {filteredLogos.map((logo, i) => (
              <div
                key={logo.id}
                className="media-card group relative rounded-xl border border-zinc-200/60 p-2 hover:border-[#04D1FC]/40 cursor-pointer bg-white overflow-hidden"
                style={logoStagger(i)}
                onClick={() => handleSelect(logo)}
              >
                <div
                  className={cn(
                    'h-14 flex items-center justify-center rounded-lg overflow-hidden',
                    logo.isWhite ? 'bg-zinc-800' : 'bg-zinc-50'
                  )}
                >
                  <img
                    src={logo.url}
                    alt={logo.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                    crossOrigin="anonymous"
                    style={{ transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </div>
                <p className="text-[9px] text-center mt-1.5 truncate text-zinc-500 font-medium">
                  {logo.name}
                </p>
                <div className="absolute top-1 right-1">
                  <span
                    className={cn(
                      'px-1 py-0.5 text-[7px] font-medium rounded',
                      logo.category === 'primary'
                        ? 'bg-blue-50 text-blue-500'
                        : 'bg-purple-50 text-purple-500'
                    )}
                  >
                    {logo.category}
                  </span>
                </div>
                <div
                  className="absolute inset-0 rounded-xl border-2 border-[#04D1FC] opacity-0 group-hover:opacity-100 pointer-events-none"
                  style={{ transition: 'opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-100/60 space-y-2">
            <p className="text-[10px] text-zinc-400 text-center">
              {filteredLogos.length} logo{filteredLogos.length !== 1 ? 's' : ''} • Click to use
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaKitPanel;
