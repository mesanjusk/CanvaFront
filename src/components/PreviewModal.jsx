import React from 'react';

const PreviewModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="bg-white max-h-screen overflow-auto p-4" onClick={e => e.stopPropagation()}>
        <img src={src} alt="Preview" className="max-h-screen object-contain" />
      </div>
    </div>
  );
};

export default PreviewModal;
