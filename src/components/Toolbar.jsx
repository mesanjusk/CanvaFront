import React from "react";

const Toolbar = ({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddImage,
  onBringToFront,
  onSendToBack,
  onDownload,
  onCropImage,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
}) => (
  <div className="fixed bottom-0 left-0 w-full bg-white shadow-md py-2 flex flex-wrap gap-2 justify-center z-50">
    <button onClick={onAddText} className="btn">Text</button>
    <button onClick={onAddRect} className="btn">Rectangle</button>
    <button onClick={onAddCircle} className="btn">Circle</button>
    <label className="btn cursor-pointer">
      Image
      <input type="file" accept="image/*" className="hidden" onChange={onAddImage} />
    </label>
    <button onClick={onBringToFront} className="btn">Front</button>
    <button onClick={onSendToBack} className="btn">Back</button>
    <button onClick={onDownload} className="btn">Download</button>
    <button onClick={onCropImage} className="btn">Crop</button>
    <button onClick={onAlignLeft} className="btn">Align Left</button>
    <button onClick={onAlignCenter} className="btn">Align Center</button>
    <button onClick={onAlignRight} className="btn">Align Right</button>
    <button onClick={onAlignTop} className="btn">Align Top</button>
    <button onClick={onAlignMiddle} className="btn">Align Middle</button>
    <button onClick={onAlignBottom} className="btn">Align Bottom</button>
    <style>{`
      .btn {
        background: #1e293b;
        color: #fff;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        margin: 0 2px;
        font-size: 1rem;
        transition: background 0.2s;
        cursor: pointer;
      }
      .btn:hover {
        background: #475569;
      }
    `}</style>
  </div>
);

export default Toolbar;
