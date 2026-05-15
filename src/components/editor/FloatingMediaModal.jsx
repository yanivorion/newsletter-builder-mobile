import React from 'react';
import MediaKitPanel from './MediaKitPanel';
import EditorBottomSheet from './EditorBottomSheet';

function FloatingMediaModal({
  open,
  onClose,
  onSelectLogo,
  onBulkUpload,
  boundsRef,
  userId,
  bottomInsetPx = 78,
}) {
  return (
    <EditorBottomSheet
      open={open}
      title="Media assets"
      onClose={onClose}
      boundsRef={boundsRef}
      bottomInsetPx={bottomInsetPx}
      maxHeight="min(52vh, 420px)"
      ariaLabel="Media assets"
      contentClassName="px-1 pb-1"
    >
      <MediaKitPanel onSelectLogo={onSelectLogo} onBulkUpload={onBulkUpload} userId={userId} />
    </EditorBottomSheet>
  );
}

export default FloatingMediaModal;
