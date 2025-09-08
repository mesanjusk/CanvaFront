import React, { useRef } from "react";
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  ArrowUp,
  ArrowDown,
  Download,
  Crop,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalSpaceAround,
  Settings,
} from "lucide-react";

const Toolbar = React.memo(({
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
  onOpenSettings,
}) => {
  const fileInput = useRef();

  return (
    <div className="flex flex-wrap gap-1 items-center">
      <button onClick={onAddText} title="Add Text" className="icon-btn">
        <Type size={20} />
      </button>
      <button onClick={onAddRect} title="Add Rectangle" className="icon-btn">
        <Square size={20} />
      </button>
      <button onClick={onAddCircle} title="Add Circle" className="icon-btn">
        <Circle size={20} />
      </button>
      <button
        onClick={() => fileInput.current.click()}
        title="Add Image"
        className="icon-btn"
      >
        <ImageIcon size={20} />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAddImage}
        />
      </button>
      <button onClick={onBringToFront} title="Bring To Front" className="icon-btn">
        <ArrowUp size={20} />
      </button>
      <button onClick={onSendToBack} title="Send To Back" className="icon-btn">
        <ArrowDown size={20} />
      </button>
      <button onClick={onDownload} title="Download" className="icon-btn">
        <Download size={20} />
      </button>
      <button onClick={onCropImage} title="Crop Selected Image" className="icon-btn">
        <Crop size={20} />
      </button>
      <button onClick={onAlignLeft} title="Align Left" className="icon-btn">
        <AlignLeft size={20} />
      </button>
      <button onClick={onAlignCenter} title="Align Center Horizontally" className="icon-btn">
        <AlignCenter size={20} />
      </button>
      <button onClick={onAlignRight} title="Align Right" className="icon-btn">
        <AlignRight size={20} />
      </button>
      <button onClick={onAlignTop} title="Align Top" className="icon-btn">
        <ArrowUp size={20} />
      </button>
      <button onClick={onAlignMiddle} title="Align Center Vertically" className="icon-btn">
        <AlignVerticalSpaceAround size={20} />
      </button>
      <button onClick={onAlignBottom} title="Align Bottom" className="icon-btn">
        <ArrowDown size={20} />
      </button>
      <button onClick={onOpenSettings} title="Settings" className="icon-btn md:hidden">
        <Settings size={20} />
      </button>
      <style>{`
        .icon-btn {
          background: none;
          border: none;
          color: #1e293b;
          border-radius: 0.4rem;
          padding: 0.4rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .icon-btn:hover {
          background: #f1f5f9;
        }
        .icon-btn:active {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
});

export default Toolbar;
