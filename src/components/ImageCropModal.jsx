import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

function getCroppedImg(src, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      }, "image/png");
    };
    image.onerror = (e) => reject(e);
  });
}

const aspectOptions = {
  Free: undefined, // Must be undefined, not null
  "1:1": 1 / 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "3:4": 3 / 4,
};

const ImageCropModal = ({ src, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(undefined); // undefined for free crop
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      const croppedImgUrl = await getCroppedImg(src, croppedAreaPixels);
      onConfirm(croppedImgUrl);
    } catch (e) {
      alert("Crop failed: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center max-w-lg w-full">
        <h2 className="mb-2 font-semibold">Crop Image</h2>

        <div className="mb-2">
          <label className="text-sm mr-2">Aspect Ratio:</label>
          <select
            value={aspect ?? "Free"}
            onChange={(e) => {
              const selected = e.target.value;
              setAspect(selected === "Free" ? undefined : Number(selected));
            }}
            className="border rounded px-2 py-1"
          >
            {Object.entries(aspectOptions).map(([label, value]) => (
              <option key={label} value={value ?? "Free"}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative bg-black" style={{ width: 350, height: 350 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect} // now supports free crop with `undefined`
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex gap-4 mt-4 items-center">
          <label>
            Zoom:
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: 100, marginLeft: 8 }}
            />
          </label>
          <button className="btn" onClick={handleConfirm}>
            Confirm
          </button>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
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
