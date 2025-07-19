import React, { useRef } from "react";

const ImageCropModal = ({ src, onCancel, onConfirm }) => {
  const imgRef = useRef(null);

  // For now, just return the same image as "cropped"
  const handleConfirm = () => {
    onConfirm(src);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center max-w-lg">
        <h2 className="mb-2 font-semibold">Crop Image</h2>
        <img
          ref={imgRef}
          src={src}
          alt="Crop"
          style={{ maxWidth: 350, maxHeight: 350 }}
          className="mb-4 border"
        />
        <div className="flex gap-4">
          <button className="btn" onClick={handleConfirm}>Confirm</button>
          <button className="btn" onClick={onCancel}>Cancel</button>
        </div>
        <style>{`
          .btn {
            background: #1e293b;
            color: #fff;
            border: none;
            border-radius: 0.5rem;
            padding: 0.4rem 1rem;
            margin: 0 2px;
            font-size: 1rem;
            cursor: pointer;
          }
          .btn:hover {
            background: #475569;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ImageCropModal;
